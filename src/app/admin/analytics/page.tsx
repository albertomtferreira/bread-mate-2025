'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LineChart, ShoppingCart, PoundSterling, Package, X, Heart, RefreshCcw, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay, addDays, subMonths, subYears, startOfYear } from 'date-fns';
import type { Order } from '@/types';
import { DateRangePicker } from '@/components/ui/datepicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from 'react-day-picker';
import Link from 'next/link';
import { syncAllFavoriteCounts } from '@/lib/syncFavorites';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  salesByDay: { date: string; sales: number }[];
  topProducts: { name: string; quantity: number }[];
  totalFavorites: number;
  topFavoritedProducts: { name: string; count: number }[];
  // Customer Insights
  retentionRate: number;
  avgCLV: number;
  customerComposition: { name: string; value: number; color: string }[];
  totalCustomers: number;
  topCustomers: { name: string; totalSpent: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [preset, setPreset] = useState<string>("30_days");

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value === "custom") return;
    
    const now = new Date();
    let from: Date | undefined;
    let to: Date = now;

    switch (value) {
      case "7_days":
        from = subDays(now, 6);
        break;
      case "30_days":
        from = subDays(now, 29);
        break;
      case "3_months":
        from = subMonths(now, 3);
        break;
      case "ytd":
        from = startOfYear(now);
        break;
      case "1_year":
        from = subYears(now, 1);
        break;
      default:
        return;
    }

    setDateRange({ from, to });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
        await syncAllFavoriteCounts();
        toast({
            title: "Sync Complete",
            description: "Favorite counts have been successfully recalculated."
        });
        // Refresh data after sync
        window.location.reload(); 
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Sync Failed",
            description: "There was an error while syncing counts."
        });
    } finally {
        setSyncing(false);
    }
  }

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!dateRange || !dateRange.from) {
        setLoading(false);
        return;
      }
        
      setLoading(true);

      try {
        const startDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

        const ordersCollection = collection(db, 'orders');
        const q = query(ordersCollection, 
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<=', Timestamp.fromDate(endDate)),
        );
        
        let ordersSnapshot = await getDocs(q);
        let orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

        // --- Drill-down filter ---
        if (selectedProduct) {
            orders = orders.filter(order => 
                order.items.some(item => item.name === selectedProduct)
            );
        }

        // --- Calculate Key Metrics ---
        let totalRevenue = 0;
        if(selectedProduct) {
            totalRevenue = orders.reduce((acc, order) => {
                const productTotal = order.items
                    .filter(item => item.name === selectedProduct)
                    .reduce((itemAcc, item) => itemAcc + (item.price * item.quantity), 0);
                return acc + productTotal;
            }, 0);
        } else {
            totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
        }

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // --- Process Sales Over Time ---
        const salesByDayMap = new Map<string, number>();
        for (let dt = new Date(startDate); dt <= endDate; dt = addDays(dt, 1)) {
            const formattedDate = format(dt, 'MMM dd');
            salesByDayMap.set(formattedDate, 0);
        }
        
        orders.forEach(order => {
          if (order.createdAt) {
            const orderDate = order.createdAt.toDate();
            const formattedDate = format(orderDate, 'MMM dd');
            const currentSales = salesByDayMap.get(formattedDate) || 0;
            
            let salesForDay = order.total;
            if (selectedProduct) {
                salesForDay = order.items
                    .filter(item => item.name === selectedProduct)
                    .reduce((itemAcc, item) => itemAcc + (item.price * item.quantity), 0);
            }
            
            salesByDayMap.set(formattedDate, currentSales + salesForDay);
          }
        });
        
        const salesByDay = Array.from(salesByDayMap.entries())
          .map(([date, sales]) => ({ date, sales }));
        
        // --- Process Top Selling Products ---
        const productCountMap = new Map<string, number>();
        orders.forEach(order => {
          order.items.forEach(item => {
            const currentCount = productCountMap.get(item.name) || 0;
            productCountMap.set(item.name, currentCount + item.quantity);
          });
        });

        const topProducts = Array.from(productCountMap.entries())
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5); 

        // --- Process Favorite Tracking (Separate query for all products) ---
        const productsCollection = collection(db, 'products');
        const prodSnapshot = await getDocs(productsCollection);
        let totalFavorites = 0;
        const favoritesList: { name: string; count: number }[] = [];

        prodSnapshot.docs.forEach(doc => {
            const prodData = doc.data();
            // Safeguard against negative numbers (Math.max(0, ...))
            const count = Math.max(0, prodData.favoriteCount || 0);
            totalFavorites += count;
            favoritesList.push({ name: prodData.name, count: count });
        });

        const topFavoritedProducts = favoritesList
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // --- Process Customer Insights (Scan all orders for true retention) ---
        const allOrdersSnapshot = await getDocs(collection(db, 'orders'));
        const allOrders = allOrdersSnapshot.docs.map(doc => doc.data() as Order);
        
        const customerOrderCounts = new Map<string, number>();
        let grandTotalRevenue = 0;

        allOrders.forEach(order => {
            const email = order.customerEmail;
            customerOrderCounts.set(email, (customerOrderCounts.get(email) || 0) + 1);
            grandTotalRevenue += order.total || 0;
        });

        const totalCustomers = customerOrderCounts.size;
        const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
        const newCustomers = totalCustomers - returningCustomers;
        
        const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
        const avgCLV = totalCustomers > 0 ? grandTotalRevenue / totalCustomers : 0;

        const customerComposition = [
            { name: 'New Customers', value: newCustomers, color: 'hsl(var(--primary))' },
            { name: 'Returning Customers', value: returningCustomers, color: 'hsl(var(--accent))' }
        ];

        // --- Process Top Customers by CLV ---
        const topCustomers = Array.from(customerOrderCounts.entries())
            .map(([email, count]) => {
                const customerRevenue = allOrders
                    .filter(o => o.customerEmail === email)
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                return { name: email, totalSpent: customerRevenue };
            })
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

        setData({
          totalRevenue,
          totalOrders,
          avgOrderValue,
          salesByDay,
          topProducts,
          totalFavorites,
          topFavoritedProducts,
          retentionRate,
          avgCLV,
          customerComposition,
          totalCustomers,
          topCustomers
        });

      } catch (error) {
        console.error("Error fetching analytics data: ", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, selectedProduct]);
  
  const handleBarClick = (data: any) => {
    if(data && data.name) {
      setSelectedProduct(data.name);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-4">
            <Button 
                variant="outline" 
                size="sm"
                onClick={handleSync} 
                disabled={syncing}
                className="gap-2"
            >
                <RefreshCcw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {syncing ? "Syncing..." : "Sync Favorites"}
            </Button>
            
            <div className="flex items-center gap-2">
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Quick Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7_days">Last 7 Days</SelectItem>
                        <SelectItem value="30_days">Last 30 Days</SelectItem>
                        <SelectItem value="3_months">Last 3 Months</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="1_year">Last Year</SelectItem>
                        <SelectItem value="custom" disabled>Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                
                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={(range) => {
                        setDateRange(range);
                        if (preset !== "custom") setPreset("custom");
                    }} 
                />
            </div>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <LineChart/> {selectedProduct ? `${selectedProduct} Analytics` : 'Analytics Dashboard'}
        </h1>
        <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              {dateRange?.from && (
                `Showing data from ${format(dateRange.from, 'LLL dd, y')} ${dateRange.to ? `to ${format(dateRange.to, 'LLL dd, y')}` : ''}`
              )}
            </p>
             {selectedProduct && (
                <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="h-auto p-1 text-sm text-destructive hover:bg-destructive/10">
                    <X className="mr-2" />
                    Clear Product Filter
                </Button>
            )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-96">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !data || (data.totalOrders === 0 && !selectedProduct) ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription className="mt-2">
                {selectedProduct 
                    ? `There were no sales for ${selectedProduct} in the selected period.`
                    : 'There are no orders in the selected date range.'
                }
            </CardDescription>
        </Card>
      ) : (
      <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{selectedProduct ? `Revenue from ${selectedProduct}`: 'Total Revenue'}</CardTitle>
             <PoundSterling className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">£{data.totalRevenue.toFixed(2)}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{selectedProduct ? `Orders with ${selectedProduct}`: 'Total Orders'}</CardTitle>
             <ShoppingCart className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{data.totalOrders}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">£{data.avgOrderValue.toFixed(2)}</div>
           </CardContent>
         </Card>
         {!selectedProduct && (
           <>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">{data.retentionRate.toFixed(1)}%</div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Avg. Product Lifetime Value</CardTitle>
                 <PoundSterling className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">£{data.avgCLV.toFixed(2)}</div>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
                 <Heart className="h-4 w-4 text-destructive" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">{data.totalFavorites}</div>
             </CardContent>
           </Card>
           </>
         )}
       </div>

       <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-7">
         <Card className={selectedProduct ? 'lg:col-span-10' : 'lg:col-span-4'}>
             <CardHeader>
                 <CardTitle>Sales Over Time</CardTitle>
             </CardHeader>
             <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                     <AreaChart data={data.salesByDay}>
                         <defs>
                             <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                             </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                         <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                         <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, selectedProduct ? `${selectedProduct} Sales` : 'Total Sales']} />
                         <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#colorSales)" />
                     </AreaChart>
                 </ResponsiveContainer>
             </CardContent>
         </Card>
         {!selectedProduct && (
             <Card className="lg:col-span-3">
                 <CardHeader>
                     <CardTitle>Customer Composition</CardTitle>
                     <CardDescription>New vs. returning customers breakdown.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.customerComposition}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.customerComposition.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </CardContent>
             </Card>
         )}
         {!selectedProduct && (
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Top 5 products by quantity sold in period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical">
                                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                <XAxis type="number" hide />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => handleBarClick(data)} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}
        {!selectedProduct && (
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Most Favorited Products</CardTitle>
                    <CardDescription>Top products identified by customer favorites.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topFavoritedProducts} layout="vertical">
                                <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                                <XAxis type="number" hide />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )}
        {!selectedProduct && (
            <Card className="lg:col-span-7">
                <CardHeader>
                    <CardTitle>Top Customers by Lifetime Value</CardTitle>
                    <CardDescription>Top 5 customers by total spending across all history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {data.topCustomers.map((customer, index) => (
                            <div key={customer.name} className="flex items-center">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none truncate max-w-[200px]">{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">Artisan Bread Enthusiast</p>
                                </div>
                                <div className="ml-auto font-bold">
                                    £{customer.totalSpent.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
      </>
      )}
    </div>
  );
}

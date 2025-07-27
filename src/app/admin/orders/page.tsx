'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OrderDetailsDialog } from '@/components/OrderDetailsDialog';
import { AddTrackingDialog } from '@/components/AddTrackingDialog';
import { updateOrderStatus } from '@/services/orderService';

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = fetchOrders();
    return () => unsubscribe();
  }, [fetchOrders]);
  
  const handleUpdateOrderStatus = async (order: Order, status: Order['status']) => {
    try {
        await updateOrderStatus({ order, status });
        toast({
            title: "Order Updated",
            description: `Order ${order.id.substring(0,7)} has been marked as ${status}.`
        })
    } catch (error: any) {
        console.error("Failed to update order status: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "Could not update the order status."
        })
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Processing': return 'default';
        case 'Shipped': return 'secondary';
        case 'Delivered': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" asChild>
                <Link href="/admin">
                    <ArrowLeft className="mr-2" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        <div className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">Manage Orders</CardTitle>
                <CardDescription>Track and update the status of customer orders.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.substring(0, 7)}...</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>£{order.total.toFixed(2)}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <OrderDetailsDialog order={order} />
                    
                    <AddTrackingDialog order={order} />

                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleUpdateOrderStatus(order, 'Delivered')} disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                <CheckCircle />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Mark as Delivered</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleUpdateOrderStatus(order, 'Cancelled')} disabled={order.status === 'Delivered' || order.status === 'Cancelled'} className="text-destructive">
                                <XCircle />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Cancel Order</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

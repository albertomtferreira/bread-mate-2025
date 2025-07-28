'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  ShoppingBag,
  User,
  Home,
  CheckCircle2,
  XCircle,
  Pencil,
  Eye,
  MailWarning,
  ExternalLink,
  Heart,
  History,
} from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserDetailsForm } from '@/app/signup/details/page';
import { UpdateAccountDialog } from '@/components/UpdateAccountDialog';
import { ManageAddressDialog } from '@/components/ManageAddressDialog';
import type { Order, Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { OrderDetailsDialog } from '@/components/OrderDetailsDialog';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FavoriteButton } from '@/components/FavoriteButton';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductDetailSheet } from '@/components/ProductDetailDialog';


type UserDetails = UserDetailsForm & {
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryPostcode?: string;
  favorites?: string[];
};

type FavoriteProductInfo = Product & {
    lastPurchased: Date | null;
}

const AddressDisplay = ({
  title,
  address,
}: {
  title: string;
  address: Partial<UserDetailsForm>;
}) => {
  if (
    !address.addressLine1 &&
    !address.city &&
    !address.postcode
  ) {
    return (
      <div>
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-muted-foreground">No address on file.</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-lg">{title}</h4>
      <address className="not-italic text-muted-foreground">
        {address.addressLine1}
        <br />
        {address.addressLine2 && (
          <>
            {address.addressLine2}
            <br />
          </>
        )}
        {address.city}, {address.postcode}
      </address>
    </div>
  );
};

export default function AccountPage() {
  const { user, logout, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    } else {
      const fetchAccountData = async () => {
        setLoading(true);
        try {
          // Fetch user details and orders in parallel
          const userDocRef = doc(db, 'users', user.uid);
          const userDocPromise = getDoc(userDocRef);
          
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('userId', '==', user.uid));
          const ordersPromise = getDocs(q);

          const [docSnap, querySnapshot] = await Promise.all([userDocPromise, ordersPromise]);
          
          const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          userOrders.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
          setOrders(userOrders);

          if (docSnap.exists()) {
             const details = docSnap.data() as UserDetails;
             setUserDetails(details);

             // Fetch favorite products if there are any
            if (details.favorites && details.favorites.length > 0) {
                const productsRef = collection(db, 'products');
                const favQuery = query(productsRef, where(documentId(), 'in', details.favorites));
                const favSnapshot = await getDocs(favQuery);
                
                const favsWithDates = favSnapshot.docs.map(doc => {
                    const product = { id: doc.id, ...doc.data() } as Product;
                    let lastPurchased: Date | null = null;
                    
                    // Find the most recent order containing this product
                    for (const order of userOrders) {
                        if (order.items.some(item => item.id === product.id)) {
                            lastPurchased = order.createdAt.toDate();
                            break; // Since orders are sorted descending, the first match is the latest
                        }
                    }
                    return { ...product, lastPurchased };
                });
                
                setFavoriteProducts(favsWithDates);
            } else {
              setFavoriteProducts([]);
            }
          }

        } catch (error) {
            console.error("Failed to fetch account data:", error);
        } finally {
            setLoading(false);
        }
      };
      fetchAccountData();
    }
  }, [user, router]);

  const handleDetailsUpdate = (newDetails: Partial<UserDetails>) => {
    setUserDetails(prevDetails => ({...prevDetails, ...newDetails} as UserDetails));
  };

  const getTrackingUrl = (order: Order) => {
    if(!order.trackingUrl || !order.trackingNumber) return null;
    return order.trackingUrl.replace('{trackingNumber}', order.trackingNumber);
  }
  
  const renderStatus = (order: Order) => {
    const fromNow = (date: Date) => formatDistanceToNow(date, { addSuffix: true });
    
    switch (order.status) {
      case 'Delivered':
        return (
          <>
            <span className="font-semibold text-green-600">Delivered</span>
            {order.deliveredAt && (
              <span className="text-muted-foreground ml-2">
                {fromNow(order.deliveredAt.toDate())}
              </span>
            )}
          </>
        );
      case 'Shipped':
        const trackingUrl = getTrackingUrl(order);
        if (trackingUrl) {
            return (
                 <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-blue-600 hover:underline">
                    Shipped
                    <ExternalLink className="ml-1 h-4 w-4" />
                 </a>
            )
        }
        return (
          <>
            <span className="font-semibold text-blue-600">Shipped</span>
            {order.shippedAt && (
              <span className="text-muted-foreground ml-2">
                {fromNow(order.shippedAt.toDate())}
              </span>
            )}
          </>
        );
       case 'Processing':
        return (
           <>
            <span className="font-semibold">Processing</span>
            <span className="text-muted-foreground ml-2">
                {fromNow(order.createdAt.toDate())}
            </span>
           </>
        );
      case 'Cancelled':
        return <span className="font-semibold text-destructive">Cancelled</span>;
      default:
        return <span className="font-semibold">{order.status}</span>
    }
  };


  if (loading || !user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-11rem)] items-center justify-center py-16 text-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">
            {user ? 'Loading your details...' : 'Redirecting to sign in...'}
          </p>
        </div>
      </div>
    );
  }
  
  const hasDeliveryAddress = userDetails?.deliveryAddressLine1;

  const deliveryAddress = {
    addressLine1:
      userDetails?.deliveryAddressLine1 || userDetails?.addressLine1,
    addressLine2:
      userDetails?.deliveryAddressLine2 || userDetails?.addressLine2,
    city: userDetails?.deliveryCity || userDetails?.city,
    postcode: userDetails?.deliveryPostcode || userDetails?.postcode,
  };

  return (
    <div className="bg-background flex-1">
        <div className="container mx-auto py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
            <h1 className="text-4xl font-headline font-bold">My Account</h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Welcome back, {user.name}!
            </p>
            </div>
            <Button onClick={logout} variant="outline">
            <LogOut className="mr-2" /> Sign Out
            </Button>
        </div>

        {!user.emailVerified && (
            <Alert variant="default" className="mb-8 bg-yellow-50 border-yellow-200 text-yellow-800">
                <MailWarning className="h-4 w-4 !text-yellow-600" />
            <AlertTitle className="font-bold !text-yellow-900">Verify Your Email Address</AlertTitle>
            <AlertDescription className="!text-yellow-700">
                Please check your inbox (and spam folder) to verify your email. If you didn't receive it, we can{' '}
                <Button variant="link" onClick={sendVerificationEmail} className="p-0 h-auto text-yellow-700 font-bold hover:text-yellow-800">
                resend the verification email
                </Button>
                .
            </AlertDescription>
            </Alert>
        )}

        <div className="space-y-12">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-1">
                    <Card>
                        <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <User /> Account Information
                        </CardTitle>
                        <CardDescription>Your personal information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                            <div className="space-y-1">
                            <Label>Name</Label>
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-muted-foreground truncate">{user.name}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{user.name}</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            </div>
                            <div className="space-y-1">
                            <Label>Email</Label>
                            <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <p className="text-muted-foreground truncate">{user.email}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{user.email}</p>
                                </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            </div>
                            <div className="space-y-1 col-span-1 sm:col-span-2">
                            <Label>Contact Number</Label>
                            <p className="text-muted-foreground">{userDetails?.contactNumber || 'Not provided'}</p>
                            </div>
                        </div>
                        <Separator />
                            <div>
                            <Label>Communication Preferences</Label>
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    {userDetails?.emailComms ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-destructive" />}
                                    <span>Email Marketing</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    {userDetails?.textComms ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-destructive" />}
                                    <span>SMS Marketing</span>
                                </div>
                            </div>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <UpdateAccountDialog
                            currentUserDetails={userDetails}
                            onAccountUpdate={handleDetailsUpdate}
                            />
                        </CardFooter>
                    </Card>
                </div>

                 <div className="lg:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Home /> Your Addresses
                        </CardTitle>
                        <CardDescription>
                            Your billing and primary delivery addresses.
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <AddressDisplay
                            title="Billing Address"
                            address={userDetails ?? {}}
                        />
                        {hasDeliveryAddress && (
                            <AddressDisplay
                                title="Delivery Address"
                                address={deliveryAddress}
                            />
                        )}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <ManageAddressDialog
                                currentUserDetails={userDetails}
                                onAddressUpdate={handleDetailsUpdate}
                            />
                        </CardFooter>
                    </Card>
                 </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Heart /> My Favorites
                    </CardTitle>
                    <CardDescription>
                        Your saved items for quick access and re-ordering.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {favoriteProducts.length > 0 ? (
                        <div className="space-y-4">
                        {favoriteProducts.map(product => (
                            <div key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                                 <ProductDetailSheet product={product}>
                                    <div className="flex items-center gap-4 cursor-pointer group">
                                         <Image src={product.image} alt={product.name} width={80} height={80} className="rounded-md object-cover" />
                                        <div className="flex-grow">
                                            <h4 className="font-semibold group-hover:underline">{product.name}</h4>
                                            <p className="text-sm text-muted-foreground">£{product.price.toFixed(2)}</p>
                                            {product.lastPurchased && (
                                                <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
                                                    <History className="h-3 w-3" />
                                                    Last purchased: {formatDistanceToNow(product.lastPurchased, { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                 </ProductDetailSheet>
                                
                                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                                    <AddToCartButton product={product} />
                                    <FavoriteButton product={product} />
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You haven't favorited any items yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ShoppingBag /> Order History
                </CardTitle>
                <CardDescription>
                    Review your past purchases with us.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                        <Card key={order.id}>
                            <CardContent className="p-4">
                                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                    <div>
                                        <h3 className="font-semibold">Order #{order.id.substring(0, 7)}...</h3>
                                        <p className="text-sm text-muted-foreground">
                                        Ordered on: {new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">£{order.total.toFixed(2)}</p>
                                        <div className="text-sm">
                                        {renderStatus(order)}
                                        </div>
                                    </div>
                                </div>
                                <Separator className="my-3" />
                                <p className="text-sm text-muted-foreground">
                                    Items: {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-end bg-muted/50 p-3">
                                <OrderDetailsDialog order={order}>
                                    <Button variant="outline">
                                        <Eye className="mr-2" /> View Details
                                    </Button>
                                </OrderDetailsDialog>
                            </CardFooter>
                        </Card>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You haven't placed any orders yet.</p>
                    )}
                </div>
                </CardContent>
            </Card>
        </div>
        </div>
    </div>
  );
}

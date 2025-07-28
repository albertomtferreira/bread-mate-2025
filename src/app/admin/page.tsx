
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GalleryHorizontalEnd, Image, ShoppingBag, Users, Package, MessageSquare, LineChart, Truck, FileText } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/contexts/NotificationProvider";


export default function AdminPage() {
  const { newMessageCount, newOrderCount } = useNotifications();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Manage your website's content and operations from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <ShoppingBag /> Product Management
            </CardTitle>
            <CardDescription>
              Add, edit, or remove the breads available for sale in your store.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
               <Link href="/admin/products">Manage Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
             <Package /> Order Management
            </CardTitle>
            <CardDescription>
              Track orders, view order details, and update their fulfillment status.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full relative">
               <Link href="/admin/orders">
                 Manage Orders
                {newOrderCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full animate-pulse">
                    {newOrderCount}
                  </Badge>
                )}
               </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
             <Users /> Customer Management
            </CardTitle>
            <CardDescription>
              View customer details, update their information, and manage accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
               <Link href="/admin/customers">Manage Customers</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
             <LineChart /> Business Analytics
            </CardTitle>
            <CardDescription>
              View sales trends, top products, and other key business metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button asChild className="w-full">
               <Link href="/admin/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>


        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Image /> Media & Content
            </CardTitle>
            <CardDescription>
              Manage visual assets and customer communications for your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
            <Button asChild>
              <Link href="/admin/carousel" className="flex items-center gap-2">
                <GalleryHorizontalEnd /> Carousel
              </Link>
            </Button>
            <Button asChild>
               <Link href="/admin/gallery" className="flex items-center gap-2">
                <Image /> Gallery
              </Link>
            </Button>
            <Button asChild>
               <Link href="/admin/content" className="flex items-center gap-2">
                <FileText /> Site Text
              </Link>
            </Button>
             <Button asChild className="relative">
               <Link href="/admin/contacts" className="flex items-center gap-2">
                <MessageSquare /> Messages
                 {newMessageCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full animate-pulse">
                    {newMessageCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Truck /> Shipping Management
                </CardTitle>
                <CardDescription>
                    Manage the couriers you use for shipping and their tracking URLs.
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
                <Button asChild className="w-full">
                    <Link href="/admin/couriers">Manage Couriers</Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

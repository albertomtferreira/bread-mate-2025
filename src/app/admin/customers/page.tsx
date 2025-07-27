'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, KeyRound } from 'lucide-react';
import type { UserDetailsForm } from '@/app/signup/details/page';
import { EditCustomerDialog } from '@/components/EditCustomerDialog';
import { ChangeRoleDialog } from '@/components/ChangeRoleDialog';

interface User extends UserDetailsForm {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
}

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
      setLoading(true);
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const userList = usersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        } as User));
        setCustomers(userList);
      } catch (error) {
        console.error("Error fetching customers: ", error);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerUpdate = () => {
    // Re-fetch all customers to get the latest data
    fetchCustomers();
  };


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
                <CardTitle className="font-headline">Manage Customers</CardTitle>
                <CardDescription>View and manage your customer accounts.</CardDescription>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.contactNumber || 'N/A'}</TableCell>
                <TableCell>{customer.isAdmin ? 'Admin' : 'Customer'}</TableCell>
                <TableCell className="text-right">
                  <EditCustomerDialog customer={customer} onCustomerUpdate={handleCustomerUpdate} />
                  <ChangeRoleDialog customer={customer} onRoleChange={handleCustomerUpdate} />
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

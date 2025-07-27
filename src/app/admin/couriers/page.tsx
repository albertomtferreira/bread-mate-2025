'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { AddCourierDialog } from '@/components/AddCourierDialog';
import { EditCourierDialog } from '@/components/EditCourierDialog';

export interface Courier {
  id: string;
  name: string;
  trackingUrl: string;
}

export default function ManageCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    try {
      const couriersCollection = collection(db, 'couriers');
      const courierSnapshot = await getDocs(couriersCollection);
      const courierList = courierSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      } as Courier));
      setCouriers(courierList);
    } catch (error) {
      console.error("Error fetching couriers: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const handleCourierChange = () => {
    fetchCouriers();
  };
  
  const handleCourierDeleted = useCallback(async (courier: Courier) => {
    try {
      await deleteDoc(doc(db, 'couriers', courier.id));
      toast({
        title: "Courier Deleted",
        description: `${courier.name} has been successfully removed.`
      });
      fetchCouriers();
    } catch (error) {
      console.error("Error deleting courier: ", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was an error deleting the courier."
      });
    }
  }, [fetchCouriers, toast]);


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
                <CardTitle className="font-headline">Manage Couriers</CardTitle>
                <CardDescription>Add, edit, or remove shipping couriers.</CardDescription>
            </div>
            <AddCourierDialog onCourierAdded={handleCourierChange} />
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
              <TableHead>Tracking URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couriers.map((courier) => (
              <TableRow key={courier.id}>
                <TableCell>{courier.name}</TableCell>
                <TableCell className="font-mono text-xs">{courier.trackingUrl}</TableCell>
                <TableCell className="text-right">
                  <EditCourierDialog courier={courier} onCourierEdited={handleCourierChange} />
                   <DeleteConfirmationDialog 
                    onConfirm={() => handleCourierDeleted(courier)}
                    dialogTitle={`Delete ${courier.name}?`}
                    dialogDescription="This action cannot be undone. This will permanently delete the courier from your system."
                 >
                    <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 />
                    </Button>
                 </DeleteConfirmationDialog>
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

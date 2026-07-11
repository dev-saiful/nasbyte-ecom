"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressCard } from "@/components/account/address-card";
import { AddressForm } from "@/components/account/address-form";
import { Button } from "@/components/ui/button";

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await fetch("/api/account/addresses");
      const data = await response.json();
      setAddresses(data.addresses);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEdit = (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (address) {
      setEditingAddress(address);
      setFormOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleFormSuccess = () => {
    setEditingAddress(null);
    fetchAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Addresses</h1>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : addresses.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No addresses saved yet
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              {...address}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddressForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingAddress}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

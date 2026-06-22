import { redirect } from "next/navigation";
import { AccountOverview } from "@/components/account/account-overview";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    totalOrders,
    pendingOrders,
    savedAddresses,
    recentOrder,
    defaultAddress,
  ] = await Promise.all([
    prisma.order.count({
      where: { userId, deletedAt: null },
    }),
    prisma.order.count({
      where: { userId, status: "PENDING", deletedAt: null },
    }),
    prisma.address.count({
      where: { userId, deletedAt: null },
    }),
    prisma.order.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
      },
    }),
    prisma.address.findFirst({
      where: { userId, isDefault: true, deletedAt: null },
      select: {
        id: true,
        recipientName: true,
        addressLine: true,
        city: true,
      },
    }),
  ]);

  const recentOrderSerialized = recentOrder
    ? { ...recentOrder, total: Number(recentOrder.total) }
    : null;

  return (
    <AccountOverview
      totalOrders={totalOrders}
      pendingOrders={pendingOrders}
      savedAddresses={savedAddresses}
      recentOrder={recentOrderSerialized}
      defaultAddress={defaultAddress}
    />
  );
}

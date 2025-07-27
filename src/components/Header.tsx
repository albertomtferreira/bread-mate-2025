'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, ShoppingCart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/contexts/CartProvider';
import { Logo } from './Logo';
import { useNotifications } from '@/contexts/NotificationProvider';

const navLinks = [
  { href: '/order', label: 'Order' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { totalNotifications } = useNotifications();
  const cartCount = getCartCount();

  const navItems = (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-foreground/60'
          )}
        >
          {link.label}
        </Link>
      ))}
      {user && (
         <Link
          href="/account"
          className={cn(
            'transition-colors hover:text-primary',
            pathname === '/account' ? 'text-primary' : 'text-foreground/60'
          )}
        >
          Account
        </Link>
      )}
       {user?.isAdmin && (
        <button className="admin-theme bg-background rounded-xl px-3 py-1 font-semibold border border-primary text-primary transition-colors hover:text-primary">
          <Link
              href="/admin"
              className={cn(
                  'flex items-center gap-2 transition-colors hover:text-primary',
                  pathname.startsWith('/admin') ? 'text-primary' : 'text-foreground/60'
              )}
          >
             <div className="relative">
                <Shield className={cn("transition-colors", totalNotifications > 0 && "stroke-primary fill-destructive text-destructive-foreground")} />
                 {totalNotifications > 0 && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-destructive-foreground">
                    {totalNotifications}
                  </span>
                )}
             </div>
             Admin
          </Link>
      </button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 max-w-screen-2xl items-center px-4 mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-8" />
          </Link>
          <nav className="hidden gap-6 text-sm font-medium md:flex md:items-center">
            {navItems}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
           <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/checkout">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Shopping Basket</span>
            </Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/account">Account</Link>
                </DropdownMenuItem>
                 {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/signin">Sign In</Link>
            </Button>
          )}

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 p-4">
                  <Link href="/" className="mb-4 flex items-center space-x-2">
                     <Logo className="h-8" />
                  </Link>
                  <nav className="flex flex-col gap-4">{navItems}</nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

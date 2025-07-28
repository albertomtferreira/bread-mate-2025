import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto max-w-screen-2xl flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Logo className="h-8" />
          <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            <p>© {new Date().getFullYear()} bread mate. All Rights Reserved.</p>
             <p>
                Created by{' '}
                <a
                    href="https://github.com/albertomtferreira"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 hover:text-primary"
                >
                    Alberto Ferreira
                </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold">v1.5</span>
          <Link href="https://www.instagram.com/albertotaoinlondon/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            Instagram
          </Link>
          <Link href="https://www.facebook.com/profile.php?id=61556691611741" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            Facebook
          </Link>
        </div>
      </div>
    </footer>
  );
}

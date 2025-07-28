'use client';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { VersionHistoryDialog } from './VersionHistoryDialog';

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto flex h-24 items-center justify-between">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by{' '}
          <a
            href="https://firebase.google.com/docs/studio"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Firebase Studio
          </a>
          . The source code is available on{' '}
          <a
            href="https://github.com/FirebaseExtended/studio-demo-project-flourish-and-dough"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            GitHub
          </a>
          .
        </p>

        <VersionHistoryDialog>
            <Button variant="link" className="text-muted-foreground">
                v1.6
            </Button>
        </VersionHistoryDialog>
      </div>
    </footer>
  );
}

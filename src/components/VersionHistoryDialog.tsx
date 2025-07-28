'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { versionHistory } from '@/lib/versionHistory';
import { Badge } from './ui/badge';


interface VersionHistoryDialogProps {
    children: React.ReactNode;
}

export function VersionHistoryDialog({ children }: VersionHistoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Version History</DialogTitle>
          <DialogDescription>
            A log of all the major updates and features implemented.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4">
             <Accordion type="single" collapsible defaultValue="item-0">
                {versionHistory.map((version, index) => (
                    <AccordionItem value={`item-${index}`} key={version.version}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">{version.version}</span>
                                <Badge variant="outline">{version.date}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                {version.changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>

      </DialogContent>
    </Dialog>
  );
}

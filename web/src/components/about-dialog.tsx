import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/icon.svg" alt="MapHub" className="w-6 h-6" />
            关于 MapHub
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p>MapHub 是一个超快的在线自动驾驶地图查看器，支持多种地图格式。</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本：</span>
                <span>{__VERSION__}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Git Hash：</span>
                <span className="font-mono text-xs">{__GIT_HASH__}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

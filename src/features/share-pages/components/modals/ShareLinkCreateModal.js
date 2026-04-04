"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShareLinkForm from "../ShareLinkForm";

export default function ShareLinkCreateModal({
  open,
  onOpenChange,
  onCreated,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col overflow-hidden p-0 sm:max-h-[min(100dvh-2rem,58rem)] sm:w-[min(96vw,78rem)]">
        <DialogHeader className="border-b px-4 py-4 pr-12 text-left sm:px-5 md:px-6">
          <DialogTitle>Tạo share link</DialogTitle>
          <DialogDescription>
            Tạo nhanh share link mới ngay trong màn danh sách, hiển thị gọn trên
            điện thoại và đủ rộng trên tablet, desktop.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-6 md:py-5">
          {open ? (
            <ShareLinkForm
              embedded
              onCreated={onCreated}
              onCancel={() => onOpenChange?.(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

interface BulkActionsProps {
  selectedCount: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}

export default function BulkActions({
  selectedCount,
  onPublish,
  onUnpublish,
  onDelete,
}: BulkActionsProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        <span className="font-medium">{selectedCount}개</span>의 게시물이 선택됨
      </div>

      <div className="flex gap-2">
        <button
          onClick={onPublish}
          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition-colors"
        >
          발행하기
        </button>

        <button
          onClick={onUnpublish}
          className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm rounded-lg hover:bg-amber-200 transition-colors"
        >
          임시저장으로 변경
        </button>

        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
        >
          삭제하기
        </button>
      </div>
    </div>
  );
}

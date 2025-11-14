"use client";

import AddToListButton from "@/app/_components/AddToListButton";

type AddToListSectionProps = {
  productId: string;
  productName: string;
  productImage?: string;
  productDescription?: string;
};

export default function AddToListSection({
  productId,
  productName,
  productImage,
  productDescription
}: AddToListSectionProps) {
  return (
    <div className="mt-6">
      <AddToListButton
        productId={productId}
        productName={productName}
        productImage={productImage}
        productDescription={productDescription}
        variant="default"
      />
    </div>
  );
}


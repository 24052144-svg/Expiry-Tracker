"use client";

import Image from "next/image";
import { Pencil, Trash } from "lucide-react";

interface Props {
	image?: string;
	name: string;
	subText: string;
	category?: string;
	onEdit?: () => void;
	onDelete?: () => void;
}

const getCategoryEmoji = (category?: string) => {
	const emojis: Record<string, string> = {
		"non-veg": "🍖",
		medicine: "💊",
		cosmetics: "💄",
		dairy: "🥛",
		drinks: "🥤",
		groceries: "🛒",
		other: "📦",
	};
	return emojis[category || ""] || "📦";
};

export default function ProductCard({
	image,
	name,
	subText,
	category,
	onEdit,
	onDelete,
}: Props) {
	// Debug log to trace image URLs
	console.log(`ProductCard [${name}]: image =`, image, "category =", category);

	return (
		<div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow w-full">
			<div className="w-16 h-16 rounded-xl overflow-hidden bg-linear-to-br from-pink-100 to-yellow-100 shrink-0 flex items-center justify-center">
				{image && image !== "/placeholder.png" && image !== "" ? (
					<Image
						src={image}
						alt={name}
						width={64}
						height={64}
						className="object-cover w-full h-full"
						unoptimized
					/>
				) : (
					<div className="flex items-center justify-center w-full h-full text-3xl bg-gray-50/50">
						{getCategoryEmoji(category)}
					</div>
				)}
			</div>

			<div className="flex-1 min-w-0">
				<h3 className="font-semibold text-gray-900 truncate mb-0.5">
					{name}
				</h3>
				<p className="text-sm text-gray-500 truncate">
					{subText}
				</p>
			</div>

			<div className="flex gap-1.5 ml-2">
				{onEdit && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
						className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-colors"
						title="Edit product"
					>
						<Pencil className="w-4 h-4" />
					</button>
				)}
				{onDelete && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
						title="Delete product"
					>
						<Trash className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
}

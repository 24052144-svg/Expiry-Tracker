"use client";

import HamburgerMenu from "./HamburgerMenu";
export default function DashboardHeader({ userName }: { userName: string }) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<p className="text-gray-500">Hello,</p>
				<h1 className="text-2xl font-semibold">{userName}</h1>
			</div>

			<HamburgerMenu />
		</div>
	);
}

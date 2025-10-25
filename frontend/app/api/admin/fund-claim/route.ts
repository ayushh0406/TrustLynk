import { NextResponse } from "next/server";

// NOTE: In Stellar/Soroban, claim approvals and fund transfers are handled directly
// via the smart contract using the approve_claim function. This route is kept for
// backwards compatibility but is no longer needed for the actual blockchain transfer.

const XLM_DECIMALS = 10000000; // 1 XLM = 10^7 stroops

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { userAddress, amountStroops } = body as {
			userAddress: string;
			amountStroops: number;
		};

		if (!userAddress || !amountStroops || amountStroops <= 0) {
			return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
		}

		// In Soroban, funds transfer is handled by the smart contract's approve_claim function
		// This is called directly from the frontend wallet, so this route just returns success
		return NextResponse.json({
			success: true,
			message: "Claim approval should be done via smart contract approve_claim function",
			userAddress,
			amountStroops,
			amountXLM: (amountStroops / XLM_DECIMALS).toFixed(4),
		});
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
	}
}

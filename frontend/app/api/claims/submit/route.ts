import { NextResponse } from "next/server";
import type { FraudAnalysisRequest } from "@/lib/fraud-detection";
import fraudDetectionAPI, { getClaimStatusFromScore } from "@/lib/fraud-detection";

// Keep conversion consistent with frontend/lib/blockchain.ts
const XLM_DECIMALS = 10000000; // 1 XLM = 10^7 stroops
const INR_TO_XLM_RATE = 1000000; // 1 XLM = 10 INR (simplified)

function convertINRToXLM(inrAmount: number): number {
	return Math.floor((inrAmount * XLM_DECIMALS) / INR_TO_XLM_RATE);
}

// No admin account needed for Stellar - claims are handled via smart contract

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			policyId,
			userAddress,
			claimAmountINR,
			fraudPayload,
		} = body as {
			policyId: string;
			userAddress: string;
			claimAmountINR: number;
			fraudPayload?: FraudAnalysisRequest;
		};

		if (!policyId || !userAddress || !claimAmountINR || claimAmountINR <= 0) {
			return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
		}

		// 1) Run fraud analysis (real API if available, else fallback to mock)
		let aggregateScore: number;
		try {
			if (fraudPayload) {
				const result = await fraudDetectionAPI.analyzeFraudRisk(fraudPayload);
				aggregateScore = result.aggregate_score;
			} else {
				const mock = fraudDetectionAPI.generateMockAnalysis(claimAmountINR, policyId);
				aggregateScore = mock.aggregate_score;
			}
		} catch (e) {
			// Fallback to mock on API failure
			const mock = fraudDetectionAPI.generateMockAnalysis(claimAmountINR, policyId);
			aggregateScore = mock.aggregate_score;
		}

		const status = getClaimStatusFromScore(aggregateScore); // APPROVED | PENDING | REJECTED

		// Return analysis result - frontend will handle wallet transactions
		return NextResponse.json({
			success: true,
			policyId,
			userAddress,
			claimAmountINR,
			aggregateScore,
			status,
			requiresTransfer: status === "APPROVED",
			transferAmount: status === "APPROVED" ? convertINRToXLM(claimAmountINR) : 0,
		});
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
	}
}



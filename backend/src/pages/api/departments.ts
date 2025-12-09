// src/pages/api/departments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const sql = `
      SELECT dept_id, dept_name
      FROM DEPARTMENT
      ORDER BY dept_id
    `;
    const result = await executeQuery(sql, []);
    const rows = (result as any).rows || [];

    return res.status(200).json({
      departments: rows,
    });
  } catch (err) {
    console.error("DEPARTMENTS ERROR:", err);
    return res.status(500).json({ message: "서버 에러", error: String(err) });
  }
}


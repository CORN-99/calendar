// backend/src/pages/api/groups.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId 필요함" });
    }

    const sql = `
      SELECT
        g.GROUP_ID,
        g.G_NAME    AS GROUP_NAME,
        g.PURPOSE   AS CATEGORY,
        g.LEADER    AS LEADER_ID,
        m.STUDENT_ID,
        s.NAME,
        s.DEPT_ID
      FROM MEMBER m
      JOIN STUDENT_GROUP g ON m.GROUP_ID = g.GROUP_ID
      JOIN STUDENT s       ON m.STUDENT_ID = s.STUDENT_ID
      WHERE g.GROUP_ID IN (
        SELECT GROUP_ID FROM MEMBER WHERE STUDENT_ID = :1
      )
      ORDER BY g.GROUP_ID, s.STUDENT_ID
    `;

    const result = await executeQuery(sql, [studentId]);

    return res.status(200).json({
      message: "ok",
      rows: result.rows,
    });
  } catch (err) {
    console.error("groups api error:", err);
    return res
      .status(500)
      .json({ message: "서버 에러", error: String(err) });
  }
}
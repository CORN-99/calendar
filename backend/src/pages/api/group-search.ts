// src/pages/api/group-search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { group_name } = req.body;

  if (!group_name || group_name.trim() === "") {
    return res.status(400).json({ message: "그룹명을 입력해주세요." });
  }

  try {
    // 그룹명으로 검색 (부분 일치)
    const searchSql = `
      SELECT 
        g.GROUP_ID,
        g.G_NAME AS GROUP_NAME,
        g.PURPOSE AS PURPOSE,
        g.LEADER,
        s.NAME AS LEADER_NAME,
        g.MEMBER_COUNT
      FROM STUDENT_GROUP g
      JOIN STUDENT s ON g.LEADER = s.STUDENT_ID
      WHERE UPPER(g.G_NAME) LIKE UPPER('%' || :1 || '%')
      ORDER BY g.G_NAME
    `;

    const result = await executeQuery(searchSql, [group_name.trim()]);
    const rows = (result as any).rows || [];

    return res.status(200).json({
      groups: rows,
      count: rows.length,
    });
  } catch (err: any) {
    console.error("GROUP SEARCH ERROR:", err);
    return res.status(500).json({
      message: "서버 에러",
      error: String(err),
      details: err.message || String(err),
    });
  }
}


// src/pages/api/course-delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { student_id, course_id, section_id } = req.query;

  if (!student_id || !course_id || !section_id) {
    return res.status(400).json({ message: "학생 ID, 강좌번호, 분반이 필요합니다." });
  }

  try {
    // TAKES 테이블에서 삭제
    const sql = `
      DELETE FROM takes
      WHERE student_id = :1 AND course_id = :2 AND section_id = :3
    `;
    
    await executeQuery(sql, [student_id, course_id, section_id], {
      autoCommit: true,
    });

    return res.status(200).json({ message: "수업 삭제 성공" });
  } catch (err: any) {
    console.error("COURSE DELETE ERROR:", err);
    return res.status(500).json({ 
      message: "서버 에러", 
      error: String(err),
      details: err.message || String(err)
    });
  }
}


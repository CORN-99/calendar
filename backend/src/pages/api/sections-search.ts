// src/pages/api/sections-search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET 요청으로 테스트 (모든 SECTION 조회)
  if (req.method === "GET") {
    try {
      const sql = `
        SELECT 
          s.section_id,
          s.course_id,
          s.academic_term,
          s.time,
          s.location,
          c.title as course_title,
          c.credits
        FROM section s
        JOIN course c ON c.course_id = s.course_id
        ORDER BY s.academic_term DESC, c.course_id, s.section_id
        FETCH FIRST 10 ROWS ONLY
      `;
      const result = await executeQuery(sql, []);
      const rows = (result as any).rows || [];
      return res.status(200).json({ sections: rows, count: rows.length });
    } catch (err: any) {
      console.error("SECTIONS LIST ERROR:", err);
      return res.status(500).json({ 
        message: "서버 에러", 
        error: String(err),
        details: err.message || String(err)
      });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { searchTerm } = req.body;

  if (!searchTerm || searchTerm.trim() === "") {
    return res.status(400).json({ message: "검색어를 입력해주세요." });
  }

  try {
    // SECTION 테이블에서 검색 (COURSE와 JOIN하여 교과목명도 함께 반환)
    // Oracle node.js 드라이버는 같은 바인드를 여러 번 사용할 때 각각을 별도로 인식하므로
    // :1, :2, :3으로 분리하거나, 각각에 같은 값을 제공해야 함
    const searchPattern = `%${searchTerm.trim().toUpperCase()}%`;
    
    const sql = `
      SELECT 
        s.section_id,
        s.course_id,
        s.academic_term,
        s.time,
        s.location,
        c.title as course_title,
        c.credits
      FROM section s
      JOIN course c ON c.course_id = s.course_id
      WHERE UPPER(s.section_id) LIKE :1
         OR UPPER(c.title) LIKE :2
         OR UPPER(c.course_id) LIKE :3
      ORDER BY s.academic_term DESC, c.course_id, s.section_id
    `;
    
    console.log(`[sections-search] 검색어: "${searchTerm}", 패턴: "${searchPattern}"`);
    
    // 같은 패턴을 3번 제공 (각 바인드에)
    const result = await executeQuery(sql, [searchPattern, searchPattern, searchPattern]);
    const rows = (result as any).rows || [];

    console.log(`[sections-search] 검색 결과: ${rows.length}개`);
    if (rows.length > 0) {
      console.log(`[sections-search] 첫 번째 결과:`, rows[0]);
    }

    return res.status(200).json({
      sections: rows,
    });
  } catch (err: any) {
    console.error("SECTIONS SEARCH ERROR:", err);
    console.error("Error details:", {
      message: err.message,
      errorNum: err.errorNum,
      code: err.code,
      stack: err.stack
    });
    return res.status(500).json({ 
      message: "서버 에러", 
      error: String(err),
      details: err.message || String(err)
    });
  }
}


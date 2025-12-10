// src/pages/api/course-add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { student_id, course_id, title, credits, section_id, academic_term, time, location } = req.body;

  // 입력값 검증
  if (!student_id || !course_id || !title || !credits || !section_id || !academic_term) {
    return res.status(400).json({ message: "필수 필드를 모두 입력해주세요." });
  }

  try {
    // 1. SECTION 테이블에 해당 분반이 존재하는지 확인 (필수)
    const checkSectionSql = `
      SELECT section_id, course_id, academic_term, time, location
      FROM section
      WHERE section_id = :1 AND course_id = :2
    `;
    const sectionResult = await executeQuery(checkSectionSql, [section_id, course_id]);
    const sectionRows = (sectionResult as any).rows || [];

    if (sectionRows.length === 0) {
      return res.status(400).json({ message: "해당 분반이 존재하지 않습니다. 기존 DB의 SECTION 테이블에 있는 분반만 추가할 수 있습니다." });
    }

    // SECTION이 존재하는 경우, 학기 정보 확인
    const existingSection = sectionRows[0];
    const existingTerm = existingSection.ACADEMIC_TERM || existingSection.academic_term;
    if (existingTerm !== academic_term) {
      return res.status(400).json({ message: `해당 분반의 학기는 ${existingTerm}입니다.` });
    }

    // 2. COURSE 테이블에 과목이 존재하는지 확인
    const checkCourseSql = `
      SELECT course_id, title, credits
      FROM course
      WHERE course_id = :1
    `;
    const courseResult = await executeQuery(checkCourseSql, [course_id]);
    const courseRows = (courseResult as any).rows || [];

    if (courseRows.length === 0) {
      return res.status(400).json({ message: "해당 강좌가 존재하지 않습니다." });
    }

    // 3. TAKES 테이블에 수강 정보 추가 (중복 체크)
    const checkTakesSql = `
      SELECT student_id, course_id, section_id
      FROM takes
      WHERE student_id = :1 AND course_id = :2 AND section_id = :3
    `;
    const takesResult = await executeQuery(checkTakesSql, [student_id, course_id, section_id]);
    const takesRows = (takesResult as any).rows || [];

    if (takesRows.length === 0) {
      // TAKES 테이블에 INSERT
      const insertTakesSql = `
        INSERT INTO takes (student_id, course_id, section_id)
        VALUES (:1, :2, :3)
      `;
      await executeQuery(insertTakesSql, [student_id, course_id, section_id], {
        autoCommit: true, // 모든 작업 완료 후 커밋
      });
    } else {
      // 이미 수강 중인 경우
      return res.status(409).json({ message: "이미 수강 중인 과목입니다." });
    }

    return res.status(201).json({ message: "수업 추가 성공" });
  } catch (err: any) {
    console.error("COURSE ADD ERROR:", err);
    
    // 롤백
    try {
      await executeQuery("ROLLBACK", [], { autoCommit: true });
    } catch (rollbackErr) {
      console.error("ROLLBACK ERROR:", rollbackErr);
    }

    // Oracle 에러 코드 확인
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ message: "이미 존재하는 정보입니다." });
    } else if (err.errorNum === 2291) {
      // ORA-02291: integrity constraint violated
      return res.status(400).json({ message: "유효하지 않은 정보입니다." });
    }

    return res.status(500).json({ message: "서버 에러", error: String(err) });
  }
}


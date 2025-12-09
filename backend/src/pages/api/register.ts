// src/pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { studentId, name, deptId } = req.body;

  // 입력값 검증
  if (!studentId || !name || !deptId) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  // 학번 형식 검증 (10자리)
  if (studentId.length !== 10) {
    return res.status(400).json({ message: "학번은 10자리여야 합니다." });
  }

  // 이름 길이 검증
  if (name.length > 30) {
    return res.status(400).json({ message: "이름은 30자 이하여야 합니다." });
  }

  // 학과 ID 형식 검증
  if (deptId.length > 4) {
    return res.status(400).json({ message: "학과 ID는 4자 이하여야 합니다." });
  }

  try {
    // 1. 이미 존재하는 학번인지 확인
    const checkSql = `
      SELECT student_id
      FROM STUDENT
      WHERE student_id = :1
    `;
    const checkResult = await executeQuery(checkSql, [studentId]);
    const existingRows = (checkResult as any).rows || [];

    if (existingRows.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 학번입니다." });
    }

    // 2. 학과 ID가 유효한지 확인
    const deptCheckSql = `
      SELECT dept_id
      FROM DEPARTMENT
      WHERE dept_id = :1
    `;
    const deptResult = await executeQuery(deptCheckSql, [deptId]);
    const deptRows = (deptResult as any).rows || [];

    if (deptRows.length === 0) {
      return res.status(400).json({ message: "유효하지 않은 학과 ID입니다." });
    }

    // 3. STUDENT 테이블에 INSERT
    const insertSql = `
      INSERT INTO STUDENT (student_id, name, dept_id)
      VALUES (:1, :2, :3)
    `;
    await executeQuery(insertSql, [studentId, name, deptId], {
      autoCommit: true,
    });

    // 4. 생성된 사용자 정보 반환
    const selectSql = `
      SELECT student_id, name, dept_id
      FROM STUDENT
      WHERE student_id = :1
    `;
    const result = await executeQuery(selectSql, [studentId]);
    const rows = (result as any).rows || [];

    if (rows.length === 0) {
      return res.status(500).json({ message: "회원가입은 완료되었지만 사용자 정보를 조회할 수 없습니다." });
    }

    const user = rows[0];

    return res.status(201).json({
      message: "회원가입 성공",
      user, // { STUDENT_ID: '...', NAME: '...', DEPT_ID: '...' }
    });
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    
    // Oracle 에러 코드 확인
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ message: "이미 존재하는 학번입니다." });
    } else if (err.errorNum === 2291) {
      // ORA-02291: integrity constraint violated - parent key not found
      return res.status(400).json({ message: "유효하지 않은 학과 ID입니다." });
    }

    return res.status(500).json({ message: "서버 에러", error: String(err) });
  }
}


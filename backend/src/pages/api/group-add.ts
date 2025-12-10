// src/pages/api/group-add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { student_id, group_name, purpose } = req.body;

  // 입력값 검증
  if (!student_id || !group_name) {
    return res.status(400).json({ message: "학생 ID와 그룹명은 필수입니다." });
  }

  try {
    // 1. 학생이 존재하는지 확인
    const checkStudentSql = `
      SELECT student_id, name
      FROM student
      WHERE student_id = :1
    `;
    const studentResult = await executeQuery(checkStudentSql, [student_id]);
    const studentRows = (studentResult as any).rows || [];

    if (studentRows.length === 0) {
      return res.status(400).json({ message: "해당 학생이 존재하지 않습니다." });
    }

    // 2. 그룹 ID 생성 (MAX + 1)
    const getMaxGroupIdSql = `
      SELECT NVL(MAX(group_id), 0) AS max_id
      FROM student_group
    `;
    const maxIdResult = await executeQuery(getMaxGroupIdSql, []);
    const maxId = (maxIdResult as any).rows[0]?.MAX_ID || 0;
    const newGroupId = maxId + 1;

    // 3. STUDENT_GROUP 테이블에 그룹 추가
    const insertGroupSql = `
      INSERT INTO student_group (group_id, g_name, purpose, leader, member_count)
      VALUES (:1, :2, :3, :4, 1)
    `;
    await executeQuery(
      insertGroupSql,
      [newGroupId, group_name, purpose || null, student_id],
      { autoCommit: true }
    );

    // 4. MEMBER 테이블에 리더를 멤버로 추가
    const insertMemberSql = `
      INSERT INTO member (group_id, student_id)
      VALUES (:1, :2)
    `;
    await executeQuery(
      insertMemberSql,
      [newGroupId, student_id],
      { autoCommit: true }
    );

    return res.status(201).json({
      message: "그룹 생성 성공",
      group_id: newGroupId,
      group_name,
      leader: student_id,
    });
  } catch (err: any) {
    console.error("GROUP ADD ERROR:", err);

    // Oracle 에러 코드 확인
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ message: "이미 존재하는 그룹입니다." });
    } else if (err.errorNum === 2291) {
      // ORA-02291: integrity constraint violated
      return res.status(400).json({ message: "유효하지 않은 정보입니다." });
    }

    return res.status(500).json({
      message: "서버 에러",
      error: String(err),
      details: err.message || String(err),
    });
  }
}


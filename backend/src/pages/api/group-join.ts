// src/pages/api/group-join.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { student_id, group_id } = req.body;

  if (!student_id || !group_id) {
    return res.status(400).json({ message: "학생 ID와 그룹 ID가 필요합니다." });
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

    // 2. 그룹이 존재하는지 확인
    const checkGroupSql = `
      SELECT group_id, g_name, leader, member_count
      FROM student_group
      WHERE group_id = :1
    `;
    const groupResult = await executeQuery(checkGroupSql, [group_id]);
    const groupRows = (groupResult as any).rows || [];

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "해당 그룹이 존재하지 않습니다." });
    }

    // 3. 이미 멤버인지 확인
    const checkMemberSql = `
      SELECT student_id
      FROM member
      WHERE group_id = :1 AND student_id = :2
    `;
    const memberResult = await executeQuery(checkMemberSql, [group_id, student_id]);
    const memberRows = (memberResult as any).rows || [];

    if (memberRows.length > 0) {
      return res.status(409).json({ message: "이미 해당 그룹의 멤버입니다." });
    }

    // 4. MEMBER 테이블에 추가
    const insertMemberSql = `
      INSERT INTO member (group_id, student_id)
      VALUES (:1, :2)
    `;
    await executeQuery(insertMemberSql, [group_id, student_id], {
      autoCommit: true,
    });

    // 5. STUDENT_GROUP 테이블의 member_count 업데이트
    const updateCountSql = `
      UPDATE student_group
      SET member_count = member_count + 1
      WHERE group_id = :1
    `;
    await executeQuery(updateCountSql, [group_id], {
      autoCommit: true,
    });

    return res.status(200).json({
      message: "그룹에 참여했습니다.",
      group_id,
    });
  } catch (err: any) {
    console.error("GROUP JOIN ERROR:", err);

    // Oracle 에러 코드 확인
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({ message: "이미 해당 그룹의 멤버입니다." });
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


import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X, Edit2, Users, Calendar, Eye, EyeOff, Trash2, UserPlus } from 'lucide-react';

const CalendarUI = ({ currentUser }) => {
  const normalizedUser = currentUser
    ? {
        student_id: currentUser.STUDENT_ID || currentUser.student_id,
        name: currentUser.NAME || currentUser.name,
        dept_id: currentUser.DEPT_ID || currentUser.dept_id,
      }
    : null;
  const userId = normalizedUser?.student_id;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [students, setStudents] = useState([]);
  const [visibleStudents, setVisibleStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [departmentEvents, setDepartmentEvents] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    start_time: '',
    end_time: ''
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_id: '',
    title: '',
    credits: '',
    section_id: '',
    academic_term: '202502',
    time: '',
    location: ''
  });
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [sectionSearchResults, setSectionSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadedStudents, setLoadedStudents] = useState([]);

  // 친구 추가 모달 상태
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchFriendId, setSearchFriendId] = useState('');
  const [foundFriend, setFoundFriend] = useState(null);

  const userColors = {
    primary: '#60a5fa', // Blue 400 (내 색상)
    others: [ // 채도 낮은 친구 시간표 색상 팔레트
      '#d73b5c',  // Vivid Coral Red
      '#4785e0',  // Royal Bright Blue
      '#e9a838',  // Saffron Yellow
      '#26a457',  // Forest Emerald
      '#9846d0',  // Deep Electric Purple
      '#df7331',  // Burnt Orange
      '#d83984',  // Ruby Magenta
      '#74c53d',  // Bright Grass Green
      '#30b5c1',  // Teal Blue
      '#c244b0',  // Rich Pink Violet
      '#b5843a',  // Antique Gold
      '#406a9d',  // Deep Steel Blue
      '#c95b3b',  // Terra Cotta
      '#3f926a',  // Dark Mint Green
      '#7440b8',  // Grape Purple
    ],
  };

  const courseColorMap = useMemo(() => {
    const palette = [
      '#a690af',  // Soft Dusty Lavender (H=300)
      '#95a794',  // Muted Willow Green (H=140)
      '#a88e84',  // Light Brick Clay (H=35)
      '#8f9fa8',  // Cool Slate Gray (H=230)
      '#a29f8f',  // Stone Khaki (H=70)
      '#af969e',  // Pale Berry Rose (H=340)
      '#8d9492',  // Cloudy Grayish Cyan (H=190)
      '#a58e92',  // Subdued Mauve (H=10)
      '#8a90a2',  // Periwinkle Gray (H=260)
      '#99948c',  // Fawn Brown (H=55)
      '#989f9e',  // Light Smoke Blue (H=210)
      '#9b8c9d',  // Gentle Amethyst (H=280)
      '#9ea494',  // Pale Moss Green (H=110)
      '#a19586',  // Warm Sandstone (H=45)
      '#94959a',  // Mineral Blue (H=250)
    ];
    const map = {};
    let idx = 0;

    sections.forEach((sec) => {
      const key = sec.course_id || sec.title;
      if (!map[key]) {
        map[key] = palette[idx % palette.length];
        idx += 1;
      }
    });

    return map;
  }, [sections]);


  useEffect(() => {
    if (normalizedUser) {
      setStudents([
        {
          student_id: normalizedUser.student_id,
          name: normalizedUser.name,
          dept_id: normalizedUser.dept_id,
        },
      ]);
      setVisibleStudents([normalizedUser.student_id]);
    } else {
      setStudents([]);
      setVisibleStudents([]);
    }
  }, [userId]);

  const fetchStudentCalendarData = async (studentId) => {
    if (!studentId) return;
    try {
      const [schedRes, courseRes] = await Promise.all([
        fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }),
        fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }),
      ]);

      if (!schedRes.ok) throw new Error("일정 조회 실패");
      if (!courseRes.ok) throw new Error("수업 조회 실패");

      const schedData = await schedRes.json();
      const courseData = await courseRes.json();

      const schedRows = schedData.schedules || [];
      const courseRows = courseData.courses || [];

      const mappedSchedules = schedRows.map((s) => ({
        schedule_id: s.SCHEDULE_ID,
        student_id: s.STUDENT_ID,
        title: s.TITLE,
        start_time: s.START_TIME,
        end_time: s.END_TIME,
      }));

      const mappedSections = courseRows.map((c) => ({
        student_id: c.STUDENT_ID,
        course_id: c.COURSE_ID,
        section_id: c.SECTION_ID,
        title: c.TITLE,
        time: c.TIME,
      }));

      setSchedules((prev) => [
        ...prev.filter((s) => s.student_id !== studentId),
        ...mappedSchedules,
      ]);

      setSections((prev) => [
        ...prev.filter((sec) => sec.student_id !== studentId),
        ...mappedSections,
      ]);

      setCourses((prev) => [
        ...prev.filter((c) => c.student_id !== studentId),
        ...mappedSections,
      ]);

      setLoadedStudents((prev) =>
        prev.includes(studentId) ? prev : [...prev, studentId]
      );
    } catch (e) {
      console.error("calendar fetch error", e);
    }
  };

  // 초기에는 로그인한 사용자 일정/수업만 불러옴
  useEffect(() => {
    if (!userId) return;
    fetchStudentCalendarData(userId);
  }, [userId]);

  // 그룹 불러오기 (친구 로직 제거됨)
  useEffect(() => {
    if (!userId) return;

    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: userId }),
        });

        if (!res.ok) throw new Error("그룹 조회 실패");

        const data = await res.json();
        const grouped = {};

        (data.rows || []).forEach((row) => {
          const gid = row.GROUP_ID;
          if (!grouped[gid]) {
            grouped[gid] = {
              groupId: row.GROUP_ID,
              name: row.GROUP_NAME,
              category: row.CATEGORY,
              leaderId: row.LEADER_ID,
              members: [],
            };
          }
          grouped[gid].members.push({
            student_id: row.STUDENT_ID,
            name: row.NAME,
            dept_id: row.DEPT_ID || "",
          });
        });

        setGroups(Object.values(grouped));
      } catch (e) {
        console.error(e);
      }
    };

    fetchGroups();
  }, [userId]);

  // 친구 목록 불러오기 (신규 API 사용)
  const fetchFriends = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/friends?studentId=${userId}`);
      if (!res.ok) throw new Error("친구 조회 실패");
      
      const data = await res.json();
      const friendList = data.friends || []; // [{ student_id, name, dept_id }, ...]

      // students 목록 업데이트: 기존 목록 유지하면서 새 친구 추가
      setStudents((prev) => {
        const existingIds = new Set(prev.map(s => s.student_id));
        const newFriends = friendList.filter(f => !existingIds.has(f.student_id));
        
        // 기존 친구 목록에서 삭제된 사람 제거 필요할 수 있음 (선택 사항)
        // 여기서는 일단 누적합집합 개념으로 접근하되, friendships 상태로 필터링함
        return [...prev, ...newFriends];
      });

      // friendships 상태 업데이트
      const newFriendships = friendList.map(f => ({
        me: userId,
        friend: f.student_id
      }));
      setFriendships(newFriendships);

      // 친구가 끊긴 경우 데이터 정리
      const currentFriendIds = new Set(friendList.map(f => f.student_id));
      
      // 화면 표시 정리
      setVisibleStudents(prev => {
        // 본인이거나 현재 친구인 경우만 유지
        return prev.filter(id => id === userId || currentFriendIds.has(id));
      });

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [userId]);

  // 친구 검색
  const handleSearchFriend = async () => {
    if (!searchFriendId.trim()) return;
    try {
      const res = await fetch(`/api/students?type=search&studentId=${searchFriendId}`);
      if (!res.ok) {
        if (res.status === 404) alert("학생을 찾을 수 없습니다.");
        else alert("검색 실패");
        setFoundFriend(null);
        return;
      }
      const data = await res.json();
      setFoundFriend(data.student);
    } catch (e) {
      console.error(e);
      alert("검색 중 오류 발생");
    }
  };

  // 친구 추가
  const handleAddFriend = async () => {
    if (!foundFriend) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myId: userId, friendId: foundFriend.student_id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "친구 추가 실패");
        return;
      }

      alert("친구가 추가되었습니다.");
      setShowAddFriendModal(false);
      setSearchFriendId('');
      setFoundFriend(null);
      fetchFriends(); // 목록 새로고침
    } catch (e) {
      console.error(e);
      alert("오류 발생");
    }
  };

  // 친구 삭제
  const handleDeleteFriend = async (friendId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/friends?myId=${userId}&friendId=${friendId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("삭제 실패");
        return;
      }

      fetchFriends(); // 목록 새로고침
    } catch (e) {
      console.error(e);
    }
  };

  const getFriends = () => {
    if (!normalizedUser) return [];
    const friendIds = friendships
      .filter(f => f.me === normalizedUser.student_id)
      .map(f => f.friend);
    return students.filter(s => friendIds.includes(s.student_id));
  };

  const toggleUserVisibility = (studentId) => {
    const isOn = visibleStudents.includes(studentId);
    
    if (isOn) {
      if (visibleStudents.length === 1) return; // 최소 1명은 항상 보이게
      
      // 토글을 끌 때 친구의 데이터 즉시 완전 삭제 (본인 제외)
      if (studentId !== normalizedUser?.student_id) {
        // 즉시 상태 업데이트
        setSchedules((prev) => {
          const filtered = prev.filter(s => s.student_id !== studentId);
          return filtered;
        });
        setSections((prev) => {
          const filtered = prev.filter(sec => sec.student_id !== studentId);
          return filtered;
        });
        setCourses((prev) => {
          const filtered = prev.filter(c => c.student_id !== studentId);
          return filtered;
        });
        setLoadedStudents((prev) => prev.filter(id => id !== studentId));
      }
      
      // visibleStudents에서 제거
      setVisibleStudents((prev) => prev.filter((id) => id !== studentId));
    } else {
      // 켜질 때 그 학생의 일정/수업이 없으면 불러오기
      if (!loadedStudents.includes(studentId)) {
        fetchStudentCalendarData(studentId);
      }
      setVisibleStudents((prev) => {
        if (prev.includes(studentId)) return prev;
        return [...prev, studentId];
      });
    }
  };

  const getUserColor = (studentId) => {
    if (studentId === normalizedUser?.student_id) return userColors.primary;
    
    // studentId를 해시하여 고정된 색상 인덱스 생성
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
      hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % userColors.others.length;
    return userColors.others[index];
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.start_time || !newSchedule.end_time) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      // 날짜 형식 변환 (datetime-local -> 'YYYY-MM-DD HH24:MI')
      const startTime = newSchedule.start_time.replace('T', ' ').substring(0, 16);
      const endTime = newSchedule.end_time.replace('T', ' ').substring(0, 16);

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: normalizedUser.student_id,
          title: newSchedule.title,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "일정 추가 실패");
        return;
      }

      // 성공 시 일정 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
      setShowScheduleModal(false);
      setNewSchedule({ title: '', start_time: '', end_time: '' });
    } catch (err) {
      console.error("일정 추가 오류:", err);
      alert("일정 추가 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateSchedule = async () => {
    if (!newSchedule.title || !newSchedule.start_time || !newSchedule.end_time) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      // 날짜 형식 변환
      const startTime = newSchedule.start_time.replace('T', ' ').substring(0, 16);
      const endTime = newSchedule.end_time.replace('T', ' ').substring(0, 16);

      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: editingSchedule.schedule_id,
          title: newSchedule.title,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "일정 수정 실패");
        return;
      }

      // 성공 시 일정 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setNewSchedule({ title: '', start_time: '', end_time: '' });
    } catch (err) {
      console.error("일정 수정 오류:", err);
      alert("일정 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/schedule?id=${scheduleId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "일정 삭제 실패");
        return;
      }

      // 성공 시 일정 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
    } catch (err) {
      console.error("일정 삭제 오류:", err);
      alert("일정 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteCourse = async (courseId, sectionId) => {
    if (!window.confirm('정말 수강 취소하시겠습니까?')) return;

    try {
      const res = await fetch(
        `/api/course-delete?student_id=${normalizedUser.student_id}&course_id=${courseId}&section_id=${sectionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "수업 삭제 실패");
        return;
      }

      // 성공 시 수업 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
    } catch (err) {
      console.error("수업 삭제 오류:", err);
      alert("수업 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteGroup = async (groupId, action = "leave") => {
    const actionText = action === "delete" ? "그룹을 삭제" : "그룹에서 탈퇴";
    if (!window.confirm(`정말 ${actionText}하시겠습니까?`)) return;

    try {
      const res = await fetch(
        `/api/group-delete?group_id=${groupId}&student_id=${normalizedUser.student_id}&action=${action}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "그룹 삭제 실패");
        return;
      }

      // 성공 시 그룹 다시 불러오기
      await fetchGroups();
      // 친구 목록도 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
    } catch (err) {
      console.error("그룹 삭제 오류:", err);
      alert("그룹 삭제 중 오류가 발생했습니다.");
    }
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    // datetime-local 형식으로 변환
    const startTime = schedule.start_time ? schedule.start_time.replace(' ', 'T').substring(0, 16) : '';
    const endTime = schedule.end_time ? schedule.end_time.replace(' ', 'T').substring(0, 16) : '';
    setNewSchedule({ title: schedule.title, start_time: startTime, end_time: endTime });
    setShowScheduleModal(true);
  };

  const handleSearchSections = async (searchTerm = null) => {
    const term = searchTerm || sectionSearchTerm;
    if (!term.trim()) {
      setSectionSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/sections-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: term }),
      });

      const data = await res.json();

      if (res.ok) {
        setSectionSearchResults(data.sections || []);
      } else {
        console.error("검색 실패:", data);
        // 서버 에러인 경우에만 alert 표시
        if (res.status >= 500) {
          alert(`서버 오류: ${data.message || data.error || "알 수 없는 오류"}\n\n상세: ${data.details || ""}`);
        }
        setSectionSearchResults([]);
      }
    } catch (err) {
      console.error("수업 검색 오류:", err);
      alert("검색 중 네트워크 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
      setSectionSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 자동 검색을 위한 debounce
  useEffect(() => {
    if (!showCourseModal) return;

    const timer = setTimeout(() => {
      if (sectionSearchTerm.trim().length >= 2) {
        handleSearchSections();
      } else {
        setSectionSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [sectionSearchTerm, showCourseModal]);

  const handleSelectSection = async (section) => {
    // 선택한 분반을 바로 TAKES에 추가
    try {
      const res = await fetch("/api/course-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: normalizedUser.student_id,
          course_id: section.COURSE_ID || section.course_id,
          title: section.COURSE_TITLE || section.course_title,
          credits: section.CREDITS || section.credits,
          section_id: section.SECTION_ID || section.section_id,
          academic_term: section.ACADEMIC_TERM || section.academic_term,
          time: section.TIME || section.time || null,
          location: section.LOCATION || section.location || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "수업 추가 실패");
        return;
      }

      // 성공 시 수업 다시 불러오기
      await fetchStudentCalendarData(normalizedUser.student_id);
      setShowCourseModal(false);
      setSectionSearchTerm('');
      setSectionSearchResults([]);
    } catch (err) {
      console.error("수업 추가 오류:", err);
      alert("수업 추가 중 오류가 발생했습니다.");
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { day: date.getDate(), date: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i], fullDate: date };
    });
  };
 
const parseTimeFromSection = (timeStr) => {
  const days = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
  const items = [];
  if (!timeStr) return items;
  const parts = timeStr.split(',');

  parts.forEach(part => {
    // "월 09:00 ~ 10:30" 형식
    const match = part
      .trim()
      .match(/([월화수목금])\s+(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/);

    if (match) {
      const [, dayStr, startH, startM, endH, endM] = match;
      items.push({
        dayOfWeek: days[dayStr],
        startHour: parseInt(startH, 10),
        startMin: parseInt(startM, 10),
        endHour: parseInt(endH, 10),
        endMin: parseInt(endM, 10),
      });
    }
  });

  return items;
};

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);
  
  // 현재 친구 목록 확인 (데이터 정리용)
  const currentFriendIds = new Set(friendships.map(f => f.friend));
  const validStudentIds = new Set([
    normalizedUser?.student_id,
    ...Array.from(currentFriendIds)
  ].filter(Boolean));
  
  // 유효한 학생의 데이터만 사용 (친구 관계가 끊어진 데이터 제거)
  // visibleStudents에 있는 학생의 데이터만 사용 (토글된 학생만 표시)
  const validSchedules = useMemo(() => {
    const visibleSet = new Set(visibleStudents);
    return schedules.filter(s => 
      visibleSet.has(s.student_id) && 
      (s.student_id === normalizedUser?.student_id || validStudentIds.has(s.student_id))
    );
  }, [schedules, validStudentIds, visibleStudents, normalizedUser?.student_id]);
  
  const validSections = useMemo(() => {
    const visibleSet = new Set(visibleStudents);
    return sections.filter(sec => 
      visibleSet.has(sec.student_id) && 
      (sec.student_id === normalizedUser?.student_id || validStudentIds.has(sec.student_id))
    );
  }, [sections, validStudentIds, visibleStudents, normalizedUser?.student_id]);
  
  // 캘린더 아이템 생성 (유효한 데이터만 사용, 중복 제거)
  const allItems = useMemo(() => {
    const items = [];
    const seenIds = new Set(); // 중복 방지
    
    validSchedules.forEach(schedule => {
      const id = `schedule-${schedule.schedule_id}`;
      if (seenIds.has(id)) return; // 중복 제거
      seenIds.add(id);
      
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);
      items.push({ id, type: 'schedule', title: schedule.title, date: startDate, startTime: startDate, endTime: endDate, color: getUserColor(schedule.student_id), studentId: schedule.student_id, data: schedule });
    });
    
    validSections.forEach(section => {
      const isSelf = section.student_id === normalizedUser?.student_id;
      const courseColor = isSelf
        ? (courseColorMap[section.course_id || section.title] || userColors.primary)
        : getUserColor(section.student_id);
      const times = parseTimeFromSection(section.time);
      times.forEach(time => {
        weekDays.forEach(weekDay => {
          if (weekDay.fullDate.getDay() === time.dayOfWeek) {
            const startTime = new Date(weekDay.fullDate);
            startTime.setHours(time.startHour, time.startMin, 0);
            const endTime = new Date(weekDay.fullDate);
            endTime.setHours(time.endHour, time.endMin, 0);
            
            const id = `section-${section.section_id}-${section.student_id}-${weekDay.day}-${time.startHour}-${time.startMin}`;
            if (seenIds.has(id)) return; // 중복 제거
            seenIds.add(id);
            
            items.push({
              id,
              type: 'course',
              title: section.title,
              date: startTime,
              startTime,
              endTime,
              color: courseColor,
              studentId: section.student_id,
              data: section,
            });
          }
        });
      });
    });
    
    return items;
  }, [validSchedules, validSections, currentDate, courseColorMap, normalizedUser, weekDays]);
  
  // visibleStudents에 있는 학생의 아이템만 필터링 (이미 validSchedules/validSections에서 필터링했지만 이중 체크)
  const sortedItems = allItems.slice().sort((a, b) => a.startTime - b.startTime);
  const visibleItemsSet = new Set(visibleStudents);
  const visibleItems = sortedItems.filter(item => {
    // visibleStudents에 없으면 제외
    if (!visibleItemsSet.has(item.studentId)) return false;
    return true;
  });
  const friends = getFriends();
  const getStudentName = (studentId) => students.find(s => s.student_id === studentId)?.name || '';

  // --- 레이아웃 알고리즘 시작 ---

  // 두 아이템이 겹치는지 확인 (시간 기준)
  const checkOverlap = (a, b) => {
    return a.startTime < b.endTime && a.endTime > b.startTime;
  };

  // 특정 요일의 아이템들에 대해 위치(left, width)를 계산하는 함수
  const calculateDailyLayout = (dayItems) => {
    if (!dayItems || dayItems.length === 0) return [];

    // 1. 시작 시간 순으로 정렬 (같으면 긴 일정 우선, 그다음 ID순)
    const sortedItems = [...dayItems].sort((a, b) => {
      if (a.startTime.getTime() !== b.startTime.getTime()) {
        return a.startTime - b.startTime;
      }
      if (a.endTime.getTime() !== b.endTime.getTime()) {
        return b.endTime - a.endTime; // 긴 것 우선
      }
      return a.id.localeCompare(b.id);
    });

    // 2. 클러스터링 (서로 겹치는 일정끼리 그룹화)
    const clusters = [];
    for (const item of sortedItems) {
      let added = false;
      for (const cluster of clusters) {
        // 클러스터 내의 어떤 아이템이라도 현재 아이템과 겹치면 같은 클러스터
        if (cluster.some(other => checkOverlap(item, other))) {
          cluster.push(item);
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push([item]);
      }
    }

    // 3. 각 클러스터별로 컬럼 할당 및 위치 계산
    const layoutResults = [];

    clusters.forEach(cluster => {
      // 클러스터 내에서 다시 정렬 (이미 되어있지만 확실히)
      cluster.sort((a, b) => a.startTime - b.startTime);

      // 컬럼 할당: 각 아이템에 대해 충돌하지 않는 가장 낮은 인덱스 부여
      const columns = []; // [ [item, item], [item], ... ] 각 컬럼에 들어간 아이템들
      const itemColumnIndex = new Map(); // itemId -> columnIndex

      cluster.forEach(item => {
        let placed = false;
        // 기존 컬럼들 순회하며 빈 곳 찾기
        for (let i = 0; i < columns.length; i++) {
          const colItems = columns[i];
          // 해당 컬럼의 마지막 아이템과 겹치지 않으면 배치 가능
          // (정렬되어 있으므로 마지막 아이템만 체크하면 됨... 이 아니라,
          //  중간에 빈 공간이 있을 수 있으니 해당 컬럼의 모든 아이템과 체크해야 안전)
          const hasOverlap = colItems.some(existing => checkOverlap(item, existing));
          
          if (!hasOverlap) {
            colItems.push(item);
            itemColumnIndex.set(item.id, i);
            placed = true;
            break;
          }
        }

        if (!placed) {
          // 새 컬럼 생성
          columns.push([item]);
          itemColumnIndex.set(item.id, columns.length - 1);
        }
      });

      const totalColumns = columns.length;
      
      cluster.forEach(item => {
        const colIdx = itemColumnIndex.get(item.id);
        const width = 100 / totalColumns;
        const left = colIdx * width;

        layoutResults.push({
          item,
          style: {
            left: `${left}%`,
            width: `${width}%`, // -1px for border gap?
          }
        });
      });
    });

    return layoutResults;
  };

  // --- 레이아웃 알고리즘 끝 ---

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-72 bg-gray-950 p-4 flex flex-col overflow-auto">
        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase">내 정보</h2>
          {normalizedUser && (
            <div
              className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 ${
                visibleStudents.includes(normalizedUser.student_id)
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
              onClick={() => toggleUserVisibility(normalizedUser.student_id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getUserColor(normalizedUser.student_id) }}
                    ></div>
                    {normalizedUser.name}
                  </div>
                  <div className="text-sm text-gray-400">학번: {normalizedUser.student_id}</div>
                </div>
                {visibleStudents.includes(normalizedUser.student_id) ? (
                  <Eye size={16} className="text-blue-400" />
                ) : (
                  <EyeOff size={16} className="text-gray-500" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
              <Calendar size={14} />매주 듣는 수업
            </h2>
            <button 
              onClick={() => setShowCourseModal(true)} 
              className="text-blue-400 hover:text-blue-300"
            >
              <Plus size={14} />
            </button>
          </div>
          {courses.length === 0 ? (
            <div className="text-xs text-gray-400">수강 중인 과목 정보 없음</div>
          ) : (
            <ul className="text-xs text-gray-200 space-y-1">
              {courses.map((c, idx) => (
                <li key={idx} className="flex items-center justify-between group">
                  <span>{c.course_id} - 분반 {c.section_id}</span>
                  <button
                    onClick={() => handleDeleteCourse(c.course_id, c.section_id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    title="수강 취소"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
              <Users size={14} />친구
            </h2>
            <button 
              onClick={() => {
                setSearchFriendId('');
                setFoundFriend(null);
                setShowAddFriendModal(true);
              }} 
              className="text-blue-400 hover:text-blue-300"
            >
              <UserPlus size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {friends.map(friend => (
              <div 
                key={friend.student_id} 
                className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 transition-all group relative ${visibleStudents.includes(friend.student_id) ? 'border-blue-500' : 'border-transparent hover:border-gray-600'}`} 
                onClick={() => toggleUserVisibility(friend.student_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(friend.student_id) }}></div>
                    <div>
                      <div className="font-semibold text-sm">{friend.name}</div>
                      <div className="text-xs text-gray-400">{friend.dept_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {visibleStudents.includes(friend.student_id) ? <Eye size={16} className="text-blue-400" /> : <EyeOff size={16} className="text-gray-500" />}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFriend(friend.student_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                      title="친구 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase flex items-center gap-1">
            내 그룹 / 친구
          </h2>
          {groups.length === 0 ? (
            <div className="text-xs text-gray-400">가입된 그룹 없음</div>
          ) : (
            <div className="space-y-2 text-xs text-gray-200">
              {groups.map((g) => (
                <div
                  key={g.groupId}
                  className="border border-gray-700 rounded p-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {g.name}
                        {g.leaderId === normalizedUser?.student_id && (
                          <span className="ml-1 text-[10px] text-yellow-300">
                            (리더)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mb-1">
                        분류: {g.category}
                      </div>
                      <div className="text-[11px] text-gray-300">
                        멤버:{" "}
                        {g.members
                          .map((m) =>
                            m.student_id === normalizedUser?.student_id
                              ? `${m.name}(나)`
                              : m.name
                          )
                          .join(", ")}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      {g.leaderId === normalizedUser?.student_id ? (
                        <button
                          onClick={() => handleDeleteGroup(g.groupId, "delete")}
                          className="text-red-400 hover:text-red-300"
                          title="그룹 삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteGroup(g.groupId, "leave")}
                          className="text-gray-400 hover:text-red-400"
                          title="그룹 탈퇴"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Calendar size={14} />개인 일정</h2>
            <button onClick={() => { setEditingSchedule(null); setNewSchedule({ title: '', start_time: '', end_time: '' }); setShowScheduleModal(true); }} className="text-blue-400 hover:text-blue-300"><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {schedules
              .filter(s => s.student_id === normalizedUser?.student_id)
              .map(schedule => (
                <div key={schedule.schedule_id} className="bg-gray-800 rounded-lg p-2 text-sm group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{schedule.title}</div>
                      <div className="text-xs text-gray-400">{new Date(schedule.start_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(schedule)} className="text-gray-400 hover:text-blue-400"><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteSchedule(schedule.schedule_id)} className="text-gray-400 hover:text-red-400"><X size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase">범례</h2>
          <div className="space-y-1 text-xs">
            {visibleStudents.map(studentId => (
              <div key={studentId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(studentId) }}></div>
                <span>{getStudentName(studentId)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-1 hover:bg-gray-700 rounded"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Today</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-1 hover:bg-gray-700 rounded"><ChevronRight size={20} /></button>
            </div>
            <div className="text-lg font-semibold">{currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <div className="p-3"></div>
            {weekDays.map((day) => (
              <div key={day.day} className="border-l border-gray-700 p-3 text-center">
                <div className="text-xs text-gray-400">{day.date}</div>
                <div className={`text-2xl mt-1 ${day.fullDate.toDateString() === new Date().toDateString() ? 'bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''}`}>{day.day}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-700" style={{ height: '60px' }}>
                <div className="p-2 text-right text-sm text-gray-400 pr-3">{hour > 12 ? hour - 12 : hour} {hour < 12 ? 'AM' : 'PM'}</div>
                {weekDays.map((day) => (<div key={`${day.day}-${hour}`} className="border-l border-gray-700 relative"></div>))}
              </div>
            ))}

            {visibleItems.length > 0 && weekDays.map((day) => {
              const dayItems = visibleItems.filter(
                (item) => item.date.toDateString() === day.fullDate.toDateString()
              );
              
              const layoutItems = calculateDailyLayout(dayItems);

              return layoutItems.map(({ item, style }) => {
                const startHour = item.startTime.getHours();
                const startMin = item.startTime.getMinutes();
                const endHour = item.endTime.getHours();
                const endMin = item.endTime.getMinutes();
                
                // 7시부터 시작하므로 (startHour - 7)
                const topPosition = (startHour - 7) * 60 + startMin;
                const duration = (endHour - startHour) * 60 + (endMin - startMin);

                // 요일별 기본 위치 (12.5% 씩)
                // day.day는 날짜 숫자이므로, weekDays 배열의 인덱스를 찾아야 함
                const dayIndex = weekDays.findIndex(d => d.date === day.date);
                const dayBaseLeft = dayIndex * 12.5 + 12.5; // 첫 컬럼(시간) 12.5% 제외
                
                // style.left는 0~100% (해당 요일 컬럼 내에서의 위치)
                // 실제 left = dayBaseLeft + (style.left * 0.125)
                const finalLeft = `calc(${dayBaseLeft}% + ${parseFloat(style.left) * 0.125}%)`;
                const finalWidth = `${parseFloat(style.width) * 0.125}%`;

                return (
                  <div
                    key={item.id}
                    className="absolute rounded px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity hover:z-50 group"
                    style={{
                      backgroundColor: item.color,
                      top: `${topPosition}px`,
                      left: finalLeft,
                      width: finalWidth,
                      height: `${duration}px`,
                      minHeight: '30px',
                      color: '#000',
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    title={`${item.title}\n${item.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${item.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  >
                    <div className="font-semibold truncate">
                      {item.title}
                    </div>
                    {/* Hover 시 전체 내용 보여주기 (옵션) */}
                    <div className="hidden group-hover:block absolute left-0 top-full bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50 w-48 whitespace-normal">
                      <div className="font-bold mb-1">{item.title}</div>
                      <div>
                        {item.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {item.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {item.data && item.data.location && <div>{item.data.location}</div>}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h2>
              <button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); setNewSchedule({ title: '', start_time: '', end_time: '' }); }}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1">제목</label><input type="text" placeholder="일정 제목" value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <div><label className="block text-sm mb-1">시작 시간</label><input type="datetime-local" value={newSchedule.start_time} onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <div><label className="block text-sm mb-1">종료 시간</label><input type="datetime-local" value={newSchedule.end_time} onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <button onClick={editingSchedule ? handleUpdateSchedule : handleAddSchedule} className="w-full bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 font-semibold">{editingSchedule ? '수정' : '추가'}</button>
            </div>
          </div>
        </div>
      )}

      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">친구 추가</h2>
              <button onClick={() => setShowAddFriendModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">학번 검색</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="친구의 학번을 입력하세요" 
                    value={searchFriendId} 
                    onChange={(e) => setSearchFriendId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchFriend()}
                    className="flex-1 bg-gray-700 rounded px-3 py-2 outline-none" 
                  />
                  <button onClick={handleSearchFriend} className="bg-blue-600 hover:bg-blue-500 rounded px-3 py-2">
                    <Search size={18} />
                  </button>
                </div>
              </div>

              {foundFriend && (
                <div className="bg-gray-700 rounded p-3 border border-gray-600">
                  <div className="text-sm text-gray-300 mb-1">검색 결과</div>
                  <div className="font-semibold text-lg">{foundFriend.name}</div>
                  <div className="text-sm text-gray-400">{foundFriend.dept_id} / {foundFriend.student_id}</div>
                  
                  <button 
                    onClick={handleAddFriend} 
                    className="w-full mt-3 bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 font-semibold flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    친구 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">수업 추가</h2>
              <button onClick={() => { 
                setShowCourseModal(false); 
                setSectionSearchTerm('');
                setSectionSearchResults([]);
              }}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {/* 수업명 검색 */}
              <div>
                <label className="block text-sm mb-1 font-semibold">수업명 검색</label>
                <input 
                  type="text" 
                  placeholder="수업명을 입력하세요 (예: 데이터베이스)" 
                  value={sectionSearchTerm} 
                  onChange={(e) => setSectionSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSections();
                    }
                  }}
                  className="w-full bg-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
                  autoFocus
                />
                {isSearching && (
                  <div className="text-xs text-gray-400 mt-1">검색 중...</div>
                )}
              </div>

              {/* 검색 결과 */}
              {sectionSearchResults.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-2">
                    검색 결과: {sectionSearchResults.length}개 (클릭하여 추가)
                  </div>
                  <div className="max-h-96 overflow-y-auto border border-gray-600 rounded">
                    {sectionSearchResults.map((section, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSection(section)}
                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-sm mb-1">
                          {section.COURSE_TITLE || section.course_title}
                        </div>
                        <div className="text-xs text-gray-300 space-y-1">
                          <div>
                            <span className="text-gray-400">강좌번호:</span> {section.COURSE_ID || section.course_id}
                          </div>
                          <div>
                            <span className="text-gray-400">분반:</span> {section.SECTION_ID || section.section_id} | 
                            <span className="text-gray-400"> 학기:</span> {section.ACADEMIC_TERM || section.academic_term} | 
                            <span className="text-gray-400"> 학점:</span> {section.CREDITS || section.credits}
                          </div>
                          {(section.TIME || section.time) && (
                            <div>
                              <span className="text-gray-400">시간:</span> {section.TIME || section.time}
                            </div>
                          )}
                          {(section.LOCATION || section.location) && (
                            <div>
                              <span className="text-gray-400">장소:</span> {section.LOCATION || section.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sectionSearchTerm && sectionSearchResults.length === 0 && !isSearching && (
                <div className="text-center text-gray-400 text-sm py-4">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarUI;
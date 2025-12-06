import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X, Edit2, Users, Calendar, Eye, EyeOff } from 'lucide-react';

const CalendarUI = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleStudents, setVisibleStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [departmentEvents, setDepartmentEvents] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    start_time: '',
    end_time: ''
  });

  const userColors = {
    primary: '#60a5fa',
    friend1: '#f87171',
    friend2: '#34d399',
    friend3: '#fbbf24',
    friend4: '#a78bfa',
    friend5: '#fb923c',
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (visibleStudents.length > 0) {
      loadSchedulesForUsers(visibleStudents);
      loadSectionsForUsers(visibleStudents);
    }
  }, [visibleStudents]);

  const loadAllData = async () => {
    try {
      const mockStudents = [
        { student_id: '2021001234', name: '김민수', dept_id: 'COMP' },
        { student_id: '2021005678', name: '이지나', dept_id: 'BUSI' },
        { student_id: '2021009999', name: '박철수', dept_id: 'COMP' }
      ];
      
      const mockFriendships = [
        { me: '2021001234', friend: '2021005678' },
        { me: '2021001234', friend: '2021009999' }
      ];
      
      setStudents(mockStudents);
      setFriendships(mockFriendships);
      
      if (mockStudents.length > 0) {
        const user = mockStudents[0];
        setCurrentUser(user);
        setVisibleStudents([user.student_id]);
      }
      
      await loadAcademicEvents();
      await loadDepartmentEvents();
      await loadGroupsForUser(mockStudents[0].student_id);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadSchedulesForUsers = async (studentIds) => {
    try {
      const mockSchedules = [
        { schedule_id: 1, title: '프로젝트 회의', start_time: '2024-12-09T09:00:00', end_time: '2024-12-09T11:00:00', student_id: '2021001234' },
        { schedule_id: 2, title: '팀 스터디', start_time: '2024-12-10T14:00:00', end_time: '2024-12-10T16:00:00', student_id: '2021001234' },
        { schedule_id: 3, title: '동아리 모임', start_time: '2024-12-09T13:00:00', end_time: '2024-12-09T15:00:00', student_id: '2021005678' },
        { schedule_id: 4, title: '발표 준비', start_time: '2024-12-11T10:00:00', end_time: '2024-12-11T12:00:00', student_id: '2021005678' },
        { schedule_id: 5, title: '개인 학습', start_time: '2024-12-10T09:00:00', end_time: '2024-12-10T11:00:00', student_id: '2021009999' }
      ];
      
      const filtered = mockSchedules.filter(s => studentIds.includes(s.student_id));
      setSchedules(filtered);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const loadSectionsForUsers = async (studentIds) => {
    try {
      const mockSections = [
        { section_id: 'COMP0320-01', course_id: 'COMP0320', title: '데이터베이스', academic_term: 202502, time: '월 09:00-12:00, 수 09:00-12:00', location: '공학관 301', student_id: '2021001234' },
        { section_id: 'COMP0415-01', course_id: 'COMP0415', title: '컴퓨터구조', academic_term: 202502, time: '화 14:00-16:00', location: '공학관 401', student_id: '2021001234' },
        { section_id: 'BUSI0201-01', course_id: 'BUSI0201', title: '마케팅원론', academic_term: 202502, time: '월 13:00-15:00', location: '경영관 201', student_id: '2021005678' },
        { section_id: 'COMP0320-02', course_id: 'COMP0320', title: '데이터베이스', academic_term: 202502, time: '월 09:00-12:00, 수 09:00-12:00', location: '공학관 301', student_id: '2021009999' }
      ];
      
      const filtered = mockSections.filter(s => studentIds.includes(s.student_id));
      setSections(filtered);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const loadAcademicEvents = async () => {
    setAcademicEvents([{ academic_event_id: 1, title: '중간고사', start_date: '2024-12-09', end_date: '2024-12-13' }]);
  };

  const loadDepartmentEvents = async () => {
    setDepartmentEvents([{ dept_event_id: 1, department_id: 'COMP', title: '학과 세미나', start_date: '2024-12-12', end_date: '2024-12-12', locations: ['대강당'] }]);
  };

  const loadGroupsForUser = async () => {
    setStudentGroups([{ group_id: 1, g_name: '캡스톤디자인 팀', purpose: '졸업 프로젝트', leader: '2021001234', member_count: 4 }]);
  };

  const getFriends = () => {
    if (!currentUser) return [];
    const friendIds = friendships.filter(f => f.me === currentUser.student_id).map(f => f.friend);
    return students.filter(s => friendIds.includes(s.student_id));
  };

  const toggleUserVisibility = (studentId) => {
    setVisibleStudents(prev => {
      if (prev.includes(studentId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const getUserColor = (studentId) => {
    if (studentId === currentUser?.student_id) return userColors.primary;
    const visibleIndex = visibleStudents.indexOf(studentId);
    const colorKeys = Object.keys(userColors).filter(k => k.startsWith('friend'));
    return userColors[colorKeys[visibleIndex % colorKeys.length]] || userColors.friend1;
  };

  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.start_time || !newSchedule.end_time) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    const scheduleData = {
      schedule_id: schedules.length + 1,
      title: newSchedule.title,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      student_id: currentUser.student_id
    };
    setSchedules([...schedules, scheduleData]);
    setShowScheduleModal(false);
    setNewSchedule({ title: '', start_time: '', end_time: '' });
  };

  const handleUpdateSchedule = () => {
    setSchedules(schedules.map(s => s.schedule_id === editingSchedule.schedule_id ? { ...s, ...newSchedule } : s));
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setNewSchedule({ title: '', start_time: '', end_time: '' });
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setSchedules(schedules.filter(s => s.schedule_id !== scheduleId));
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({ title: schedule.title, start_time: schedule.start_time, end_time: schedule.end_time });
    setShowScheduleModal(true);
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
      const match = part.trim().match(/([월화수목금])\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (match) {
        const [, dayStr, startH, startM, endH, endM] = match;
        items.push({ dayOfWeek: days[dayStr], startHour: parseInt(startH), startMin: parseInt(startM), endHour: parseInt(endH), endMin: parseInt(endM) });
      }
    });
    return items;
  };

  const getAllCalendarItems = () => {
    const items = [];
    const weekDays = getWeekDays();
    
    schedules.forEach(schedule => {
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);
      items.push({ id: `schedule-${schedule.schedule_id}`, type: 'schedule', title: schedule.title, date: startDate, startTime: startDate, endTime: endDate, color: getUserColor(schedule.student_id), studentId: schedule.student_id, data: schedule });
    });
    
    sections.forEach(section => {
      const times = parseTimeFromSection(section.time);
      times.forEach(time => {
        weekDays.forEach(weekDay => {
          if (weekDay.fullDate.getDay() === time.dayOfWeek) {
            const startTime = new Date(weekDay.fullDate);
            startTime.setHours(time.startHour, time.startMin, 0);
            const endTime = new Date(weekDay.fullDate);
            endTime.setHours(time.endHour, time.endMin, 0);
            items.push({ id: `section-${section.section_id}-${section.student_id}-${weekDay.day}`, type: 'course', title: section.title, date: startTime, startTime, endTime, color: getUserColor(section.student_id), studentId: section.student_id, data: section });
          }
        });
      });
    });
    
    return items;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);
  const allItems = getAllCalendarItems();
  const friends = getFriends();
  const getStudentName = (studentId) => students.find(s => s.student_id === studentId)?.name || '';

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-72 bg-gray-950 p-4 flex flex-col overflow-auto">
        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase">내 정보</h2>
          {currentUser && (
            <div className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 ${visibleStudents.includes(currentUser.student_id) ? 'border-blue-500' : 'border-transparent'}`} onClick={() => toggleUserVisibility(currentUser.student_id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(currentUser.student_id) }}></div>
                    {currentUser.name}
                  </div>
                  <div className="text-sm text-gray-400">학번: {currentUser.student_id}</div>
                </div>
                {visibleStudents.includes(currentUser.student_id) ? <Eye size={16} className="text-blue-400" /> : <EyeOff size={16} className="text-gray-500" />}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase flex items-center gap-1"><Users size={14} />친구</h2>
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.student_id} className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 transition-all ${visibleStudents.includes(friend.student_id) ? 'border-blue-500' : 'border-transparent hover:border-gray-600'}`} onClick={() => toggleUserVisibility(friend.student_id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(friend.student_id) }}></div>
                    <div>
                      <div className="font-semibold text-sm">{friend.name}</div>
                      <div className="text-xs text-gray-400">{friend.dept_id}</div>
                    </div>
                  </div>
                  {visibleStudents.includes(friend.student_id) ? <Eye size={16} className="text-blue-400" /> : <EyeOff size={16} className="text-gray-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Calendar size={14} />개인 일정</h2>
            <button onClick={() => { setEditingSchedule(null); setNewSchedule({ title: '', start_time: '', end_time: '' }); setShowScheduleModal(true); }} className="text-blue-400 hover:text-blue-300"><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {schedules.filter(s => s.student_id === currentUser?.student_id).map(schedule => (
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

            {allItems.map((item) => {
              const matchingDay = weekDays.findIndex(d => d.fullDate.toDateString() === item.date.toDateString());
              if (matchingDay === -1) return null;
              const startHour = item.startTime.getHours();
              const startMin = item.startTime.getMinutes();
              const endHour = item.endTime.getHours();
              const endMin = item.endTime.getMinutes();
              const topPosition = (startHour - 7) * 60 + startMin;
              const duration = (endHour - startHour) * 60 + (endMin - startMin);
              return (
                <div key={item.id} className="absolute rounded px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" style={{ backgroundColor: item.color, top: `${topPosition}px`, left: `${(matchingDay / 7) * 87.5 + 12.5}%`, width: '12%', height: `${duration}px`, minHeight: '30px', color: '#000' }}>
                  <div className="font-semibold truncate">{item.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h2>
              <button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); }}><X size={20} /></button>
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
    </div>
  );
};

export default CalendarUI;
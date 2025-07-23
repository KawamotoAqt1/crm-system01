import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { areaApi } from '../../services/areaApi';

interface SearchResult {
  id: string;
  type: 'employee' | 'department' | 'position' | 'area';
  title: string;
  subtitle: string;
  path: string;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 検索実行
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // 並列で全データを検索
      const [employees, departments, positions, areas] = await Promise.all([
        apiService.getEmployees().catch(() => []),
        apiService.getDepartments().catch(() => []),
        apiService.getPositions().catch(() => []),
        areaApi.getAll().catch(() => [])
      ]);

             // 社員検索
       const employeeData = (employees as any)?.data || employees || [];
       if (Array.isArray(employeeData)) {
         employeeData.forEach((emp: any) => {
           const fullName = `${emp.lastName} ${emp.firstName}`;
           const kanaName = emp.lastNameKana && emp.firstNameKana ? 
             `${emp.lastNameKana} ${emp.firstNameKana}` : '';
           
           // 検索対象フィールドを大幅に拡張
           const searchFields = [
             fullName,
             kanaName,
             emp.email,
             emp.employeeId,
             emp.phone,
             emp.address,
             emp.department?.name,
             emp.position?.name,
             emp.area?.name,
             emp.emergencyContact,
             emp.education,
             emp.workHistory,
             emp.skills,
             emp.notes
           ].filter(Boolean).join(' ').toLowerCase();
           
           // マッチした理由を特定
           let matchReason = '';
           if (fullName.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '氏名';
           } else if (kanaName.toLowerCase().includes(query.toLowerCase())) {
             matchReason = 'フリガナ';
           } else if (emp.email?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = 'メールアドレス';
           } else if (emp.employeeId?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '社員ID';
           } else if (emp.phone?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '電話番号';
           } else if (emp.address?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '住所';
           } else if (emp.department?.name?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '部署名';
           } else if (emp.position?.name?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '役職名';
           } else if (emp.area?.name?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = 'エリア名';
           } else if (emp.emergencyContact?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '緊急連絡先';
           } else if (emp.education?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '学歴';
           } else if (emp.workHistory?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '職歴';
           } else if (emp.skills?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = 'スキル・資格';
           } else if (emp.notes?.toLowerCase().includes(query.toLowerCase())) {
             matchReason = '備考';
           }
           
           if (searchFields.includes(query.toLowerCase())) {
             const subtitle = matchReason ? 
               `${emp.department?.name || ''} · ${emp.position?.name || ''} · ${matchReason}で一致` :
               `${emp.department?.name || ''} · ${emp.position?.name || ''} · ${emp.email}`;
               
             searchResults.push({
               id: emp.id,
               type: 'employee',
               title: fullName,
               subtitle: subtitle,
               path: `/employees?highlight=${emp.id}`
             });
           }
         });
       }

             // 部署検索
       const departmentData = (departments as any)?.data || departments || [];
       if (Array.isArray(departmentData)) {
         departmentData.forEach((dept: any) => {
           const searchFields = [
             dept.name,
             dept.description
           ].filter(Boolean).join(' ').toLowerCase();
           
           if (searchFields.includes(query.toLowerCase())) {
             let matchReason = '';
             if (dept.name?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = '部署名';
             } else if (dept.description?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = '説明';
             }
             
             searchResults.push({
               id: dept.id,
               type: 'department',
               title: dept.name,
               subtitle: `部署 · ${dept.description || '説明なし'}${matchReason ? ` · ${matchReason}で一致` : ''}`,
               path: '/departments'
             });
           }
         });
       }

       // 役職検索
       const positionData = (positions as any)?.data || positions || [];
       if (Array.isArray(positionData)) {
         positionData.forEach((pos: any) => {
           const searchFields = [
             pos.name,
             pos.description,
             `レベル${pos.level}`,
             pos.level?.toString()
           ].filter(Boolean).join(' ').toLowerCase();
           
           if (searchFields.includes(query.toLowerCase())) {
             let matchReason = '';
             if (pos.name?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = '役職名';
             } else if (pos.description?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = '説明';
             } else if (pos.level?.toString().includes(query.toLowerCase())) {
               matchReason = 'レベル';
             }
             
             searchResults.push({
               id: pos.id,
               type: 'position',
               title: pos.name,
               subtitle: `役職 · レベル${pos.level || ''} · ${pos.description || '説明なし'}${matchReason ? ` · ${matchReason}で一致` : ''}`,
               path: '/positions'
             });
           }
         });
       }

       // エリア検索
       if (Array.isArray(areas)) {
         areas.forEach((area: any) => {
           const searchFields = [
             area.name,
             area.description
           ].filter(Boolean).join(' ').toLowerCase();
           
           if (searchFields.includes(query.toLowerCase())) {
             let matchReason = '';
             if (area.name?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = 'エリア名';
             } else if (area.description?.toLowerCase().includes(query.toLowerCase())) {
               matchReason = '説明';
             }
             
             searchResults.push({
               id: area.id,
               type: 'area',
               title: area.name,
               subtitle: `エリア · ${area.description || '説明なし'}${matchReason ? ` · ${matchReason}で一致` : ''}`,
               path: '/areas'
             });
           }
         });
       }

      // 結果を種別でソート
      const sortOrder = { employee: 1, department: 2, area: 3, position: 4 };
      searchResults.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);
      
      setResults(searchResults.slice(0, 20)); // 最大20件
    } catch (error) {
      console.error('検索エラー:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 検索実行（デバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && isOpen) {
        performSearch(searchTerm);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // キーボード操作
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 結果クリック処理
  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // タイプ別アイコン
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'employee': return '👤';
      case 'department': return '🏢';
      case 'position': return '🏷️';
      case 'area': return '🗺️';
      default: return '📄';
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '300px' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="名前・スキル・学歴・職歴・住所・電話番号など全項目を検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px 12px 8px 36px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: 'white'
          }}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            if (!searchRef.current?.contains(document.activeElement)) {
              e.target.style.borderColor = '#d1d5db';
            }
          }}
        />
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6b7280',
          fontSize: '16px'
        }}>
          🔍
        </div>
      </div>

      {/* 検索結果ドロップダウン */}
      {isOpen && (searchTerm || loading) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          marginTop: '4px'
        }}>
          {loading ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              🔍 検索中...
            </div>
          ) : results.length > 0 ? (
            <>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: '#6b7280',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#f9fafb'
              }}>
                {results.length}件の結果
              </div>
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: index < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: index === selectedIndex ? '#f3f4f6' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {getTypeIcon(result.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#111827',
                        fontSize: '14px'
                      }}>
                        {result.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {result.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : searchTerm ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div>"{searchTerm}" に一致する結果が見つかりません</div>
              <div style={{ fontSize: '11px', marginTop: '8px', color: '#9ca3af' }}>
                検索対象: 名前・フリガナ・メール・社員ID・電話番号・住所・部署・役職・エリア・学歴・職歴・スキル・資格・緊急連絡先・備考
              </div>
            </div>
          ) : searchTerm === '' && isOpen ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '12px'
            }}>
              <div style={{ marginBottom: '8px' }}>🔍 全データを対象とした高度な検索</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                <strong>検索可能な項目:</strong><br/>
                👤 社員: 名前・フリガナ・メール・社員ID・電話番号・住所・学歴・職歴・スキル・資格・緊急連絡先・備考<br/>
                🏢 部署: 部署名・説明<br/>
                🏷️ 役職: 役職名・レベル・説明<br/>
                🗺️ エリア: エリア名・説明
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch; 
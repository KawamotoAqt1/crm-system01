import React, { useState, useRef } from 'react';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  errorRows: number;
  data: any[];
  errors: any[];
  hasMore: {
    data: boolean;
    errors: boolean;
  };
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  importedEmployees: any[];
  errors: any[];
}

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const EmployeeImportModal: React.FC<EmployeeImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('CSVファイルを選択してください');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      console.log('CSVインポート開始:', selectedFile.name);

      const response = await fetch('http://localhost:3001/api/v1/employees/import/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      console.log('レスポンス受信:', response.status, response.statusText);

      // レスポンスステータスのチェック
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証エラー: ログインし直してください');
        } else if (response.status === 413) {
          throw new Error('ファイルサイズが大きすぎます（最大5MB）');
        } else if (response.status === 400) {
          const errorText = await response.text();
          console.error('バリデーションエラー:', errorText);
          throw new Error('CSVファイルの形式が正しくありません');
        } else {
          const errorText = await response.text();
          console.error('サーバーエラー:', errorText);
          throw new Error(`インポート処理に失敗しました (${response.status})`);
        }
      }

      // Content-Typeの確認
      const contentType = response.headers.get('Content-Type');
      console.log('Response Content-Type:', contentType);

      // レスポンスが空でないかチェック
      const text = await response.text();
      console.log('Response body length:', text.length);
      console.log('Response body preview:', text.substring(0, 200));

      if (!text || text.trim() === '') {
        throw new Error('サーバーから空のレスポンスが返されました');
      }

      // HTMLページが返された場合の検出
      if (text.includes('<!doctype html>') || text.includes('<html')) {
        throw new Error('HTMLページが返されました。バックエンドサーバーに問題がある可能性があります');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('JSON解析エラー:', jsonError);
        console.error('Raw response:', text);
        throw new Error('サーバーから無効なJSONが返されました');
      }

      if (!data.success) {
        throw new Error(data.message || 'インポートに失敗しました');
      }

      console.log('インポート成功:', data.result);
      setResult(data.result);
      setStep('result');
    } catch (err: any) {
      console.error('CSVインポートエラー:', err);
      setError(err.message || 'インポートに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // CSVテンプレートデータを直接作成
      const csvData = [
        [
          '社員ID',
          '姓',
          '名',
          'フリガナ姓',
          'フリガナ名',
          '部署',
          '役職',
          '雇用形態',
          '入社日',
          'メールアドレス',
          '電話番号',
          '生年月日',
          '住所'
        ],
        [
          'EMP001',
          '田中',
          '太郎',
          'タナカ',
          'タロウ',
          '総務部',
          '代表取締役',
          '正社員',
          '2020-04-01',
          'tanaka@example.com',
          '090-1234-5678',
          '1980-01-01',
          '東京都渋谷区'
        ],
                 [
           'EMP002',
           '佐藤',
           '花子',
           'サトウ',
           'ハナコ',
           '開発部',
           '一般職',
           '契約社員',
           '2021-07-01',
           'sato@example.com',
           '090-9876-5432',
           '1985-05-15',
           '東京都新宿区'
         ]
      ];

      // CSVエスケープ関数
      const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // CSV文字列を生成
      const csvContent = csvData
        .map(row => row.map(escapeCSV).join(','))
        .join('\n');

      // UTF-8 BOM付きでBlobを作成
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv; charset=utf-8' 
      });
      
      // ダウンロード実行
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('CSVテンプレートを正常にダウンロードしました');
    } catch (err: any) {
      console.error('テンプレートダウンロードエラー:', err);
      setError(err.message || 'テンプレートファイルのダウンロードに失敗しました');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onImportComplete();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              社員データCSVインポート
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          {/* ステップインジケーター */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '16px',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: step === 'upload' ? '#2563eb' : '#16a34a'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '500',
                border: '2px solid',
                borderColor: step === 'upload' ? '#2563eb' : '#16a34a',
                backgroundColor: step === 'upload' ? '#eff6ff' : '#f0fdf4'
              }}>
                1
              </div>
              <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500' }}>ファイル選択・インポート</span>
            </div>
            <div style={{ flex: 1, height: '2px', backgroundColor: '#d1d5db' }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: step === 'result' ? '#16a34a' : '#9ca3af'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '500',
                border: '2px solid',
                borderColor: step === 'result' ? '#16a34a' : '#d1d5db',
                backgroundColor: step === 'result' ? '#f0fdf4' : 'transparent'
              }}>
                2
              </div>
              <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '500' }}>完了</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          padding: '24px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* エラー表示 */}
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px'
            }}>
              <div style={{
                color: '#dc2626',
                fontSize: '14px'
              }}>{error}</div>
            </div>
          )}

          {/* STEP 1: ファイルアップロード */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* テンプレートダウンロード */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1e3a8a',
                  margin: '0 0 8px 0'
                }}>
                  📄 CSVテンプレートをダウンロード
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#1e40af',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  正しい形式でデータを準備するために、テンプレートファイルをダウンロードしてください。
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                >
                  テンプレートをダウンロード
                </button>
              </div>

              {/* ファイル選択 */}
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>
                  📁 CSVファイルを選択
                </h3>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.borderColor = '#9ca3af'}
                onMouseLeave={e => (e.target as HTMLElement).style.borderColor = '#d1d5db'}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: '#9ca3af' }}>
                      {/* CSVファイルアイコン */}
                      <svg style={{ margin: '0 auto', height: '48px', width: '48px', color: '#9ca3af' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        <path d="M9.5,14.5V16.5H7.5V14.5H9.5M11,13H6V18H11V13M14.5,14.5V16.5H12.5V14.5H14.5M16,13H11V18H16V13M9.5,11.5V13.5H7.5V11.5H9.5M11,10H6V15H11V10M14.5,11.5V13.5H12.5V11.5H14.5M16,10H11V15H16V10Z"/>
                      </svg>
                    </div>
                    <div style={{ fontSize: '14px', color: '#4b5563' }}>
                      {selectedFile ? (
                        <span style={{ color: '#2563eb', fontWeight: '500' }}>{selectedFile.name}</span>
                      ) : (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              color: '#2563eb',
                              fontWeight: '500',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            CSVファイルを選択
                          </button>
                          <span> または ドラッグ&ドロップ</span>
                        </>
                      )}
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      CSV形式、最大5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* 注意事項 */}
              <div style={{
                backgroundColor: '#fefce8',
                border: '1px solid #fde047',
                borderRadius: '6px',
                padding: '16px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#a16207',
                  margin: '0 0 8px 0'
                }}>⚠️ 注意事項</h4>
                <ul style={{
                  fontSize: '14px',
                  color: '#a16207',
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.5'
                }}>
                  <li>CSVファイルは UTF-8 エンコーディングで保存してください</li>
                  <li>部署名・役職名は既存のデータと完全に一致している必要があります</li>
                  <li>メールアドレスの重複は許可されません</li>
                  <li>日付は YYYY-MM-DD 形式で入力してください</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: 結果 */}
          {step === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 結果統計 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>{result.totalRows}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>処理行数</div>
                </div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#16a34a'
                  }}>{result.successCount}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#16a34a'
                  }}>成功</div>
                </div>
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '16px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#dc2626'
                  }}>{result.errorCount}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#dc2626'
                  }}>失敗</div>
                </div>
              </div>

              {/* 成功メッセージ */}
              {result.successCount > 0 && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  <div style={{
                    color: '#166534',
                    fontSize: '14px'
                  }}>
                    ✅ {result.successCount} 件の社員データが正常にインポートされました。
                  </div>
                </div>
              )}

              {/* インポートされた社員リスト（一部） */}
              {result.importedEmployees.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#16a34a',
                    margin: '0 0 12px 0'
                  }}>✅ インポート済み社員（先頭5件）</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      borderCollapse: 'collapse'
                    }}>
                      <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e5e7eb'
                          }}>社員ID</th>
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e5e7eb'
                          }}>氏名</th>
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e5e7eb'
                          }}>メール</th>
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e5e7eb'
                          }}>部署</th>
                          <th style={{
                            padding: '12px 8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid #e5e7eb'
                          }}>役職</th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: 'white' }}>
                        {result.importedEmployees.slice(0, 5).map((employee, index) => (
                          <tr key={index}>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: '14px',
                              color: '#111827',
                              borderBottom: '1px solid #e5e7eb'
                            }}>{employee.employeeId}</td>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: '14px',
                              color: '#111827',
                              borderBottom: '1px solid #e5e7eb'
                            }}>{employee.lastName} {employee.firstName}</td>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: '14px',
                              color: '#111827',
                              borderBottom: '1px solid #e5e7eb'
                            }}>{employee.email}</td>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: '14px',
                              color: '#111827',
                              borderBottom: '1px solid #e5e7eb'
                            }}>{employee.department?.name}</td>
                            <td style={{
                              padding: '12px 8px',
                              fontSize: '14px',
                              color: '#111827',
                              borderBottom: '1px solid #e5e7eb'
                            }}>{employee.position?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.successCount > 5 && (
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '8px',
                      margin: 0
                    }}>他に {result.successCount - 5} 件がインポートされました</p>
                  )}
                </div>
              )}

              {/* エラー詳細 */}
              {result.errors.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#dc2626',
                    margin: '0 0 12px 0'
                  }}>❌ エラー詳細</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.errors.map((error, index) => (
                      <div key={index} style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '12px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          color: '#991b1b'
                        }}>{error.message}</div>
                        {error.details && (
                          <div style={{
                            fontSize: '12px',
                            color: '#dc2626',
                            marginTop: '4px'
                          }}>{error.details}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#f9fafb'}
            onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = 'white'}
          >
            {step === 'result' ? '閉じる' : 'キャンセル'}
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {step === 'upload' && (
              <button
                onClick={handleImport}
                disabled={!selectedFile || loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedFile && !loading ? '#16a34a' : '#d1d5db',
                  color: selectedFile && !loading ? 'white' : '#6b7280',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: selectedFile && !loading ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => {
                  if (selectedFile && !loading) {
                    (e.target as HTMLElement).style.backgroundColor = '#15803d';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedFile && !loading) {
                    (e.target as HTMLElement).style.backgroundColor = '#16a34a';
                  }
                }}
              >
                {loading ? 'インポート中...' : 'インポート実行'}
              </button>
            )}
            
            {step === 'result' && (
              <button
                onClick={handleComplete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#1d4ed8'}
                onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
              >
                完了
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeImportModal; 
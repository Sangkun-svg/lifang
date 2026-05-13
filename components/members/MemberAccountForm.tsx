import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PasswordEyeIcon, SheetDeleteIcon } from '@/components/icons/AdminIcons';
import type { Member } from '@/types/member';
import type { SheetSummary } from '@/types/sheet';

import styles from './MemberAccountForm.module.css';

type MemberAccountFormMode = 'create' | 'edit';

type MemberAccountFormProps = {
  mode: MemberAccountFormMode;
  member?: Member;
  sheetSummaries?: SheetSummary[];
};

type FormState = {
  email: string;
  password: string;
  passwordConfirm: string;
  companyName: string;
  managerName: string;
  selectedSheetIds: string[];
};

const emptyState: FormState = {
  email: '',
  password: '',
  passwordConfirm: '',
  companyName: '',
  managerName: '',
  selectedSheetIds: [],
};

function createInitialState(mode: MemberAccountFormMode, member: Member | undefined, sheetSummaries: SheetSummary[]): FormState {
  if (mode === 'create' || !member) {
    return emptyState;
  }

  return {
    email: member.email,
    password: '***************',
    passwordConfirm: '***************',
    companyName: '주식회사 제로피',
    managerName: '이동규',
    selectedSheetIds: sheetSummaries.slice(0, Math.min(3, sheetSummaries.length)).map((sheet) => sheet.id),
  };
}

export function MemberAccountForm({ mode, member, sheetSummaries = [] }: MemberAccountFormProps) {
  const [form, setForm] = useState<FormState>(() => createInitialState(mode, member, sheetSummaries));
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');
  const [isSheetDropdownOpen, setIsSheetDropdownOpen] = useState(false);

  const isCreateMode = mode === 'create';
  const selectedSheets = useMemo(
    () => sheetSummaries.filter((sheet) => form.selectedSheetIds.includes(sheet.id)),
    [form.selectedSheetIds, sheetSummaries]
  );
  const availableSheets = useMemo(() => {
    const normalizedKeyword = sheetSearch.trim().toLowerCase();

    return sheetSummaries.filter((sheet) => {
      const isSelected = form.selectedSheetIds.includes(sheet.id);
      const matchesKeyword = normalizedKeyword
        ? `${sheet.name} ${sheet.originalFileName}`.toLowerCase().includes(normalizedKeyword)
        : true;

      return !isSelected && matchesKeyword;
    });
  }, [form.selectedSheetIds, sheetSearch, sheetSummaries]);
  const canSubmit = useMemo(
    () =>
      form.email.trim().length > 0 &&
      form.password.length > 0 &&
      form.passwordConfirm.length > 0 &&
      form.companyName.trim().length > 0 &&
      form.managerName.trim().length > 0 &&
      form.selectedSheetIds.length > 0,
    [form],
  );

  const updateField = (field: keyof Omit<FormState, 'selectedSheetIds'>, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const selectSheet = (sheetId: string) => {
    setForm((current) => ({
      ...current,
      selectedSheetIds: current.selectedSheetIds.includes(sheetId) ? current.selectedSheetIds : [...current.selectedSheetIds, sheetId],
    }));
    setSheetSearch('');
    setIsSheetDropdownOpen(false);
  };

  const removeSheet = (sheetId: string) => {
    setForm((current) => ({
      ...current,
      selectedSheetIds: current.selectedSheetIds.filter((selectedSheetId) => selectedSheetId !== sheetId),
    }));
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="member-form-title">
        <div className={styles.brandGroup}>
          <img className={styles.logo} src="/assets/lifang-logo-main.svg" alt="LIFANG INC." />
          <h1 id="member-form-title" className={styles.title}>
            고객사 신규 계정생성
          </h1>
        </div>

        <form className={styles.form}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>이메일</span>
              <input
                className={styles.input}
                data-muted={!isCreateMode}
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="이메일을 입력해주세요."
                readOnly={!isCreateMode}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>비밀번호</span>
              <span className={styles.inputWithAction} data-muted={!isCreateMode}>
                <input
                  className={styles.actionInput}
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  readOnly={!isCreateMode}
                />
                <button
                  className={styles.inputActionButton}
                  type="button"
                  aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setIsPasswordVisible((current) => !current)}
                >
                  <PasswordEyeIcon className={styles.inputActionIcon} />
                </button>
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>비밀번호 확인</span>
              <span className={styles.inputWithAction} data-muted={!isCreateMode}>
                <input
                  className={styles.actionInput}
                  type={isPasswordConfirmVisible ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={(event) => updateField('passwordConfirm', event.target.value)}
                  placeholder="비밀번호를 다시 한 번 입력해주세요."
                  readOnly={!isCreateMode}
                />
                <button
                  className={styles.inputActionButton}
                  type="button"
                  aria-label={isPasswordConfirmVisible ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                  onClick={() => setIsPasswordConfirmVisible((current) => !current)}
                >
                  <PasswordEyeIcon className={styles.inputActionIcon} />
                </button>
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>업체명</span>
              <input
                className={styles.input}
                type="text"
                value={form.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="업체명을 입력해주세요."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>담당자</span>
              <input
                className={styles.input}
                type="text"
                value={form.managerName}
                onChange={(event) => updateField('managerName', event.target.value)}
                placeholder="담당자 성함을 입력해주세요."
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>구글시트</span>
              <div className={styles.sheetPicker}>
                <input
                  className={styles.input}
                  type="search"
                  value={sheetSearch}
                  onChange={(event) => setSheetSearch(event.target.value)}
                  onFocus={() => setIsSheetDropdownOpen(true)}
                  placeholder="업로드된 시트를 검색해주세요."
                />
                {isSheetDropdownOpen ? (
                  <div className={styles.sheetDropdown} data-empty={availableSheets.length === 0}>
                    {availableSheets.length > 0
                      ? availableSheets.slice(0, 6).map((sheet) => (
                          <button className={styles.sheetOption} type="button" key={sheet.id} onClick={() => selectSheet(sheet.id)}>
                            <span>{sheet.name}</span>
                            <small>{sheet.recordCount.toLocaleString('ko-KR')}건</small>
                          </button>
                        ))
                      : <p className={styles.sheetEmpty}>선택 가능한 시트가 없습니다.</p>}
                  </div>
                ) : null}
              </div>

              {selectedSheets.length > 0 ? (
                <div className={styles.selectedSheets} aria-label="선택된 시트">
                  {selectedSheets.map((sheet) => (
                    <span className={styles.selectedSheet} key={sheet.id}>
                      <span>{sheet.name}</span>
                      <button type="button" aria-label={`${sheet.name} 선택 해제`} onClick={() => removeSheet(sheet.id)}>
                        <SheetDeleteIcon className={styles.removeSheetIcon} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {isCreateMode ? (
            <button className={styles.submitButton} data-active={canSubmit} type="button" disabled={!canSubmit}>
              계정 생성하기
            </button>
          ) : (
            <div className={styles.actionRow}>
              <Link className={styles.deleteButton} href="/admin/members">
                삭제하기
              </Link>
              <button className={styles.submitButton} data-active="true" type="button">
                수정하기
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

import { useRouter } from 'next/router';
import { FormEvent, useMemo, useState } from 'react';

import { PasswordEyeIcon, SheetDeleteIcon } from '@/components/icons/AdminIcons';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import type { ApiResponse } from '@/lib/api/responses';
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

type MemberMutationResponse = {
  member: Member;
  redirectTo: string;
};

type MemberDeleteResponse = {
  redirectTo: string;
};

type InvalidFields = Partial<Record<keyof FormState, boolean>>;

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
    companyName: member.companyName,
    managerName: member.managerName,
    selectedSheetIds: member.sheetIds.filter((sheetId) => sheetSummaries.some((sheet) => sheet.id === sheetId)),
  };
}

export function MemberAccountForm({ mode, member, sheetSummaries = [] }: MemberAccountFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialState(mode, member, sheetSummaries));
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');
  const [isSheetDropdownOpen, setIsSheetDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [invalidFields, setInvalidFields] = useState<InvalidFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCreateMode = mode === 'create';
  const selectedSheets = useMemo(
    () => sheetSummaries.filter((sheet) => form.selectedSheetIds.includes(sheet.id)),
    [form.selectedSheetIds, sheetSummaries]
  );
  const availableSheets = useMemo(() => {
    const normalizedKeyword = sheetSearch.trim().toLowerCase();

    return sheetSummaries.filter((sheet) => {
      const isSelected = form.selectedSheetIds.includes(sheet.id);
      const isAssignable = !sheet.isMatched || sheet.customerId === member?.id;
      const matchesKeyword = normalizedKeyword
        ? `${sheet.name} ${sheet.originalFileName}`.toLowerCase().includes(normalizedKeyword)
        : true;

      return !isSelected && isAssignable && matchesKeyword;
    });
  }, [form.selectedSheetIds, member?.id, sheetSearch, sheetSummaries]);
  const canSubmit = useMemo(
    () =>
      form.email.trim().length > 0 &&
      form.password.length > 0 &&
      form.passwordConfirm.length > 0 &&
      form.companyName.trim().length > 0 &&
      form.managerName.trim().length > 0,
    [form],
  );

  const updateField = (field: keyof Omit<FormState, 'selectedSheetIds'>, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
    setInvalidFields((current) => ({
      ...current,
      [field]: false,
    }));
  };

  const selectSheet = (sheetId: string) => {
    setForm((current) => ({
      ...current,
      selectedSheetIds: current.selectedSheetIds.includes(sheetId) ? current.selectedSheetIds : [...current.selectedSheetIds, sheetId],
    }));
    setSheetSearch('');
    setIsSheetDropdownOpen(false);
    setErrorMessage('');
    setSuccessMessage('');
    setInvalidFields((current) => ({
      ...current,
      selectedSheetIds: false,
    }));
  };

  const removeSheet = (sheetId: string) => {
    setForm((current) => ({
      ...current,
      selectedSheetIds: current.selectedSheetIds.filter((selectedSheetId) => selectedSheetId !== sheetId),
    }));
    setErrorMessage('');
    setSuccessMessage('');
    setInvalidFields((current) => ({
      ...current,
      selectedSheetIds: false,
    }));
  };

  const validateForm = () => {
    const nextInvalidFields: InvalidFields = {};

    if (isCreateMode && !form.email.trim().includes('@')) {
      nextInvalidFields.email = true;
      return {
        invalidFields: nextInvalidFields,
        message: '이메일 형식을 확인해주세요.',
      };
    }

    if (isCreateMode && form.password.length < 6) {
      nextInvalidFields.password = true;
      return {
        invalidFields: nextInvalidFields,
        message: '비밀번호는 6자리 이상 입력해주세요.',
      };
    }

    if (isCreateMode && form.passwordConfirm.length < 6) {
      nextInvalidFields.passwordConfirm = true;
      return {
        invalidFields: nextInvalidFields,
        message: '비밀번호 확인은 6자리 이상 입력해주세요.',
      };
    }

    if (isCreateMode && form.password !== form.passwordConfirm) {
      nextInvalidFields.password = true;
      nextInvalidFields.passwordConfirm = true;
      return {
        invalidFields: nextInvalidFields,
        message: '비밀번호가 일치하지 않습니다.',
      };
    }

    if (!form.companyName.trim()) {
      nextInvalidFields.companyName = true;
      return {
        invalidFields: nextInvalidFields,
        message: '업체명을 입력해주세요.',
      };
    }

    if (!form.managerName.trim()) {
      nextInvalidFields.managerName = true;
      return {
        invalidFields: nextInvalidFields,
        message: '담당자를 입력해주세요.',
      };
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting || isDeleting) {
      return;
    }

    if (!isCreateMode && !member) {
      setErrorMessage('수정할 회원을 찾을 수 없습니다.');
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setInvalidFields(validationError.invalidFields);
      setErrorMessage(validationError.message);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setInvalidFields({});
    setIsSubmitting(true);

    try {
      const response = await fetch(isCreateMode ? '/api/admin/members' : `/api/admin/members/${member?.id}`, {
        body: JSON.stringify(
          isCreateMode
            ? {
                companyName: form.companyName.trim(),
                email: form.email.trim(),
                managerName: form.managerName.trim(),
                password: form.password,
                passwordConfirm: form.passwordConfirm,
                sheetIds: form.selectedSheetIds,
              }
            : {
                companyName: form.companyName.trim(),
                managerName: form.managerName.trim(),
                sheetIds: form.selectedSheetIds,
              }
        ),
        headers: {
          'Content-Type': 'application/json',
        },
        method: isCreateMode ? 'POST' : 'PATCH',
      });
      const payload = (await response.json()) as ApiResponse<MemberMutationResponse>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '요청 처리 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      await router.replace(payload.data.redirectTo);
    } catch {
      setErrorMessage(
        isCreateMode ? '계정 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' : '회원 수정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!member || isSubmitting || isDeleting) {
      return;
    }

    const shouldDelete = window.confirm('회원을 삭제하면 연결된 시트와 데이터가 함께 삭제됩니다. 정말 삭제하시겠습니까?');

    if (!shouldDelete) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setInvalidFields({});
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
      });
      const payload = (await response.json()) as ApiResponse<MemberDeleteResponse>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '요청 처리 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      await router.replace(payload.data.redirectTo);
    } catch {
      setErrorMessage('회원 삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel} aria-labelledby="member-form-title">
        <div className={styles.brandGroup}>
          <img className={styles.logo} src="/assets/lifang-logo-main.svg" alt="LIFANG INC." />
          <h1 id="member-form-title" className={styles.title}>
            {isCreateMode ? '고객사 신규 계정생성' : '고객사 계정수정'}
          </h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>이메일</span>
              <input
                className={styles.input}
                data-muted={!isCreateMode}
                data-invalid={invalidFields.email}
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="이메일을 입력해주세요."
                readOnly={!isCreateMode}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>비밀번호</span>
              <span className={styles.inputWithAction} data-muted={!isCreateMode} data-invalid={invalidFields.password}>
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
              <span className={styles.inputWithAction} data-muted={!isCreateMode} data-invalid={invalidFields.passwordConfirm}>
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
                data-invalid={invalidFields.companyName}
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
                data-invalid={invalidFields.managerName}
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
                  data-invalid={invalidFields.selectedSheetIds}
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
            <button className={styles.submitButton} data-active={canSubmit} type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <DoubleBounceLoader size={18} variant="light" label="계정 생성 중" />
                  <span>생성 중</span>
                </>
              ) : (
                '계정 생성하기'
              )}
            </button>
          ) : (
            <div className={styles.actionRow}>
              <button className={styles.deleteButton} type="button" onClick={handleDelete} disabled={isSubmitting || isDeleting}>
                {isDeleting ? (
                  <>
                    <DoubleBounceLoader size={18} label="회원 삭제 중" />
                    <span>삭제 중</span>
                  </>
                ) : (
                  '삭제하기'
                )}
              </button>
              <button className={styles.submitButton} data-active={canSubmit} type="submit" disabled={!canSubmit || isSubmitting || isDeleting}>
                {isSubmitting ? (
                  <>
                    <DoubleBounceLoader size={18} variant="light" label="회원 수정 중" />
                    <span>수정 중</span>
                  </>
                ) : (
                  '수정하기'
                )}
              </button>
            </div>
          )}

          {errorMessage ? (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className={styles.successMessage} role="status">
              {successMessage}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}

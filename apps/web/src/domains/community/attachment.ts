import {
  COMMUNITY_ATTACHMENT_MAX_BYTES,
  COMMUNITY_ATTACHMENT_MAX_COUNT,
  COMMUNITY_IMAGE_MAX_DIMENSION,
  communityAttachmentKind,
  dataUrlByteSize,
  type CommunityAttachmentInput,
  type CommunityAttachmentMimeType,
} from '@family-care/shared'

/*
 * 커뮤니티 첨부 클라이언트 처리.
 * - allowlist(jpeg/png/webp/PDF)·2MB 캡은 @family-care/shared 한도를 단일 소스로 쓴다.
 * - 이미지는 업로드 전에 긴 변 1600px 이하로 캔버스 리사이즈한다(서버는 data URL을 저장만 한다).
 * - 순수 판정 로직(fitWithin/attachmentErrorMessage/formatByteSize)은 DOM 없이 테스트한다.
 */

export const ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

/** 긴 변이 max를 넘으면 비율을 유지한 채 줄인 크기를 반환한다(확대는 하지 않는다). */
export const fitWithin = (
  width: number,
  height: number,
  max: number = COMMUNITY_IMAGE_MAX_DIMENSION
): { width: number; height: number } => {
  const longest = Math.max(width, height)
  if (longest <= max || longest <= 0) {
    return { width, height }
  }
  const scale = max / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export const formatByteSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`
  }
  return `${Math.max(0, Math.round(bytes))}B`
}

/**
 * 선택한 파일이 첨부 가능한지 판정한다. 불가하면 사용자 안내 메시지를, 가능하면 null을 반환한다.
 * (이미지는 리사이즈로 작아질 수 있으므로 원본 크기 초과는 이미지가 아닐 때만 즉시 거른다.)
 */
export const attachmentErrorMessage = (
  file: { name: string; type: string; size: number },
  currentCount: number
): string | null => {
  if (currentCount >= COMMUNITY_ATTACHMENT_MAX_COUNT) {
    return `첨부는 최대 ${COMMUNITY_ATTACHMENT_MAX_COUNT}개까지 가능합니다.`
  }
  const kind = communityAttachmentKind(file.type)
  if (!kind) {
    return `${file.name}: 허용되지 않는 형식입니다. (이미지 jpeg/png/webp 또는 PDF)`
  }
  if (kind === 'pdf' && file.size > COMMUNITY_ATTACHMENT_MAX_BYTES) {
    return `${file.name}: 파일은 2MB 이하만 첨부할 수 있습니다. (현재 ${formatByteSize(file.size)})`
  }
  return null
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`${file.name}: 파일을 읽지 못했습니다.`))
    reader.readAsDataURL(file)
  })

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name}: 이미지를 불러오지 못했습니다.`))
    }
    image.src = url
  })

/** 이미지를 긴 변 1600px 이하로 줄여 같은 mime의 data URL로 만든다. */
const resizeImageToDataUrl = async (
  file: File,
  mimeType: CommunityAttachmentMimeType
): Promise<string> => {
  const image = await loadImage(file)
  const size = fitWithin(image.naturalWidth, image.naturalHeight)

  // 줄일 필요가 없으면 원본 그대로 읽는다(재인코딩 손실/팽창 방지).
  if (size.width === image.naturalWidth && size.height === image.naturalHeight) {
    return readAsDataUrl(file)
  }

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) {
    return readAsDataUrl(file)
  }
  context.drawImage(image, 0, 0, size.width, size.height)
  // 서버가 mime과 data URL 프리픽스 일치를 검증하므로 출력 형식을 원본 mime으로 고정한다.
  return canvas.toDataURL(mimeType, 0.86)
}

/**
 * File → 업로드 입력(CommunityAttachmentInput). 이미지면 리사이즈를 거치고,
 * 최종 data URL이 2MB를 넘으면 오류를 던진다(리사이즈 후에도 큰 파일 방어).
 */
export const fileToAttachmentInput = async (file: File): Promise<CommunityAttachmentInput> => {
  const kind = communityAttachmentKind(file.type)
  if (!kind) {
    throw new Error(`${file.name}: 허용되지 않는 형식입니다.`)
  }
  const mimeType = file.type as CommunityAttachmentMimeType
  const dataUrl =
    kind === 'image' ? await resizeImageToDataUrl(file, mimeType) : await readAsDataUrl(file)

  const bytes = dataUrlByteSize(dataUrl)
  if (bytes <= 0) {
    throw new Error(`${file.name}: 파일 데이터가 올바르지 않습니다.`)
  }
  if (bytes > COMMUNITY_ATTACHMENT_MAX_BYTES) {
    throw new Error(
      `${file.name}: 파일은 2MB 이하만 첨부할 수 있습니다. (변환 후 ${formatByteSize(bytes)})`
    )
  }
  return { name: file.name, mimeType, dataUrl }
}

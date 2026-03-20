import os
import re

def burst_version():
    # 1. HTML 파일 목록 가져오기
    html_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))

    if not html_files:
        print("수정할 HTML 파일이 없습니다.")
        return

    # 2. 버전 패턴 찾기 (?v=숫자)
    version_pattern = re.compile(r'(\?v=)(\d+)')

    # 3. 각 파일에서 버전 번호 증가시키기
    updated_files = 0
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = version_pattern.sub(lambda m: f"{m.group(1)}{int(m.group(2)) + 1}", content)

        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"업데이트 완료: {file_path}")
            updated_files += 1

    if updated_files > 0:
        print(f"\n총 {updated_files}개의 파일의 버전이 갱신되었습니다.")
    else:
        print("\n갱신할 버전 패턴(?v=숫자)을 찾지 못했습니다.")

if __name__ == "__main__":
    burst_version()

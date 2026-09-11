#!/usr/bin/env bash
# shared/body.template.html → serif.html / sans.html 생성 (README 구조 표 참조)
# 사용: cd hero-compare && ./build.sh
set -euo pipefail
cd "$(dirname "$0")"
tpl=shared/body.template.html
gen() { # variant title tag fonts out
  python3 - "$tpl" "$1" "$2" "$3" "$4" "$5" <<'PY'
import sys
tpl, variant, title, tag, fonts, out = sys.argv[1:]
s = open(tpl, encoding='utf-8').read()
for k, v in (('__VARIANT__', variant), ('__TITLE__', title), ('__TAG__', tag), ('__FONTS__', fonts)):
    assert k in s, f'{k} missing in template'
    s = s.replace(k, v)
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out)
PY
}
V=$(date +%s)   # 캐시 무효화: css/js 주소에 버전
gen sans  '양순민 — 흩어진 요구와 일을 정리해' 'B · 고딕판 (기본)' '' sans.html
gen serif '히어로 비교 — 명조판' 'A · 명조판' '<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Noto+Serif+KR:wght@300;500;700&display=swap" rel="stylesheet">' serif.html
# 생성 파일과 상세 페이지의 css/js 링크에 ?v= 버전 부여 (템플릿은 그대로)
for f in sans.html serif.html case-*.html; do
  sed -i '' -E "s#(shared/(compare|case)\.(css|js))(\?v=[0-9]+)?#\1?v=$V#g" "$f"
done
echo "assets versioned v=$V"

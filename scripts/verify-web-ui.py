#!/usr/bin/env python3
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


APP_URL = "http://localhost:5173"
OUT_DIR = Path("/private/tmp/family-care-web-ui")
OUT_DIR.mkdir(parents=True, exist_ok=True)


def assert_no_browser_errors(console_errors, page_errors):
    if console_errors or page_errors:
        details = "\n".join(console_errors + page_errors)
        raise AssertionError(f"browser errors detected:\n{details}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1366, "height": 900})
    page = context.new_page()

    console_errors = []
    page_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda error: page_errors.append(str(error)))

    page.goto(APP_URL)
    page.wait_for_load_state("networkidle")

    expect(page.get_by_role("heading", name="가족 돌봄 운영 플랫폼", exact=True, level=1)).to_be_visible()
    expect(page.get_by_text("방문 일정부터 보험청구까지")).to_be_visible()
    page.screenshot(path=str(OUT_DIR / "public-home-desktop.png"), full_page=True)

    public_mobile = context.new_page()
    public_mobile.set_viewport_size({"width": 390, "height": 844})
    public_mobile.goto(APP_URL)
    public_mobile.wait_for_load_state("networkidle")
    expect(
        public_mobile.get_by_role("heading", name="가족 돌봄 운영 플랫폼", exact=True, level=1)
    ).to_be_visible()
    expect(public_mobile.get_by_text("방문 일정부터 보험청구까지")).to_be_visible()
    public_mobile.screenshot(path=str(OUT_DIR / "public-home-mobile.png"), full_page=True)
    public_mobile.close()

    page.get_by_role("button", name=re.compile("로그인")).first.click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(re.compile(r"/login$"))

    demo_button = page.get_by_role("button", name=re.compile("데모 계정으로"))
    demo_button.first.click()
    page.wait_for_load_state("networkidle")

    expect(page.get_by_text("방문 일정, 돌봄 기록, 정산, 보험청구 순서")).to_be_visible()
    expect(page.get_by_role("list", name="오늘 처리할 일")).to_be_visible()
    page.screenshot(path=str(OUT_DIR / "dashboard-desktop.png"), full_page=True)

    page.get_by_role("link", name=re.compile("방문 일정")).first.click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(re.compile(r"/schedule$"))
    expect(page.get_by_role("heading", name="방문 일정", exact=True, level=1)).to_be_visible()
    expect(page.get_by_text("새 방문 일정")).to_be_visible()
    page.screenshot(path=str(OUT_DIR / "schedule-desktop.png"), full_page=True)

    page.get_by_role("link", name=re.compile("돌봄 기록")).first.click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(re.compile(r"/care$"))
    expect(page.get_by_role("heading", name="돌봄 기록", exact=True, level=1)).to_be_visible()

    page.get_by_role("link", name=re.compile("보험청구")).first.click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(re.compile(r"/claims$"))
    expect(page.get_by_role("heading", name="보험청구", exact=True, level=1)).to_be_visible()
    page.screenshot(path=str(OUT_DIR / "claims-desktop.png"), full_page=True)

    page.get_by_role("link", name=re.compile("사용 가이드")).first.click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(re.compile(r"/guide$"))
    expect(page.get_by_role("heading", name="사용 가이드", exact=True, level=1)).to_be_visible()
    expect(page.get_by_text("방문 일정 → 돌봄 기록 → 정산 → 보험청구 순서")).to_be_visible()
    page.screenshot(path=str(OUT_DIR / "guide-desktop.png"), full_page=True)

    mobile = context.new_page()
    mobile.set_viewport_size({"width": 390, "height": 844})
    mobile.goto(f"{APP_URL}/plans")
    mobile.wait_for_load_state("networkidle")
    mobile_demo_button = mobile.get_by_role("button", name=re.compile("데모 계정으로"))
    if mobile_demo_button.count() > 0:
        mobile_demo_button.first.click()
        mobile.wait_for_load_state("networkidle")
        mobile.goto(f"{APP_URL}/plans")
        mobile.wait_for_load_state("networkidle")
    if mobile.get_by_role("heading", name="요금제 관리", exact=True, level=1).count() == 0:
        mobile.screenshot(path=str(OUT_DIR / "mobile-debug.png"), full_page=True)
        body_text = mobile.locator("body").inner_text(timeout=3000)
        raise AssertionError(f"mobile /plans not visible. url={mobile.url}\n{body_text[:700]}")
    expect(mobile.get_by_role("heading", name="요금제 관리", exact=True, level=1)).to_be_visible()
    mobile.get_by_role("button", name="메뉴 열기").click()
    expect(mobile.get_by_role("link", name=re.compile("대시보드"))).to_be_visible()
    mobile.screenshot(path=str(OUT_DIR / "plans-mobile-menu.png"), full_page=True)

    assert_no_browser_errors(console_errors, page_errors)
    browser.close()

print(f"web UI verification passed. screenshots: {OUT_DIR}")

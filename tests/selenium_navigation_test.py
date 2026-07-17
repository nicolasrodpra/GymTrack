import os
import sys
from urllib.parse import urljoin

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv("GYMTRACK_BASE_URL", "https://gymtrack-main.vercel.app")
EMAIL = os.getenv("GYMTRACK_EMAIL")
PASSWORD = os.getenv("GYMTRACK_PASSWORD")
TIMEOUT = int(os.getenv("GYMTRACK_TEST_TIMEOUT", "20"))


def require_credentials():
    if EMAIL and PASSWORD:
        return
    print("Faltan GYMTRACK_EMAIL y/o GYMTRACK_PASSWORD.", file=sys.stderr)
    print("Ejemplo PowerShell:", file=sys.stderr)
    print("$env:GYMTRACK_EMAIL='tu@correo.com'; $env:GYMTRACK_PASSWORD='tu_clave'; python tests/selenium_navigation_test.py", file=sys.stderr)
    raise SystemExit(1)


def make_driver():
    options = Options()
    if os.getenv("GYMTRACK_HEADLESS", "1") != "0":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1100")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    return webdriver.Chrome(options=options)


def wait_for_page(driver, text):
    WebDriverWait(driver, TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(normalize-space(), '{text}')]"))
    )


def click_if_visible(driver, element_id):
    try:
        button = WebDriverWait(driver, 3).until(EC.element_to_be_clickable((By.ID, element_id)))
        button.click()
        return True
    except TimeoutException:
        return False


def login(driver):
    driver.get(urljoin(BASE_URL, "/login/login.html"))

    if click_if_visible(driver, "logout-session"):
        WebDriverWait(driver, TIMEOUT).until(EC.invisibility_of_element_located((By.ID, "active-session")))

    WebDriverWait(driver, TIMEOUT).until(EC.element_to_be_clickable((By.ID, "email"))).send_keys(EMAIL)
    driver.find_element(By.ID, "password").send_keys(PASSWORD)
    driver.find_element(By.ID, "submit-auth").click()

    WebDriverWait(driver, TIMEOUT).until(EC.url_contains("/dashboard/dashboard.html"))
    wait_for_page(driver, "Panel de Control")


def click_sidebar_view(driver, label, expected_text):
    link = WebDriverWait(driver, TIMEOUT).until(
        EC.element_to_be_clickable((By.XPATH, f"//aside//a[.//span[normalize-space()='{label}']]"))
    )
    link.click()
    wait_for_page(driver, expected_text)


def visit_all_views(driver):
    click_sidebar_view(driver, "Dashboard", "Panel de Control")
    click_sidebar_view(driver, "Rutinas", "Mis Rutinas")
    click_sidebar_view(driver, "Progreso", "Progreso Personal")
    click_sidebar_view(driver, "Configuración", "Ajusta GymTrack")

    driver.get(urljoin(BASE_URL, "/ejercicios/ejercicios.html"))
    wait_for_page(driver, "Agregar ejercicio")


def main():
    require_credentials()
    driver = make_driver()
    try:
        login(driver)
        visit_all_views(driver)
        print("OK: login y navegación por vistas completados.")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()

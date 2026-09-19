import os

svg_dir = "/Users/parth/University/Classes/3rd semester/DSN/docs/presentation/svg"
os.makedirs(svg_dir, exist_ok=True)

def save_svg(name, content):
    with open(os.path.join(svg_dir, f"{name}.svg"), "w") as f:
        f.write(content)

def basic_svg(text):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
    <rect width="100%" height="100%" fill="#2c3e50" rx="10" />
    <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#ecf0f1" text-anchor="middle" dominant-baseline="middle">{text}</text>
</svg>"""

# Slide 1
save_svg("s1_logo", basic_svg("System Logo: UrbanFix"))
save_svg("s1_portal_mock", basic_svg("Web Portal App Interface"))
save_svg("s1_ai_icon", basic_svg("AI Validation & Moderation"))

# Slide 2
save_svg("s2_manual_report", basic_svg("Manual Reporting workflow"))
save_svg("s2_loss_data", basic_svg("Lost/Duplicate Data"))
save_svg("s2_no_tracking", basic_svg("No Tracking ID System"))

# Slide 3
save_svg("s3_phone_limit", basic_svg("Phone Hotline: No Photos"))
save_svg("s3_crowd_limit", basic_svg("Crowdsource: No Urgency"))
save_svg("s3_research_gap", basic_svg("Research Gap Identified"))

# Slide 4
save_svg("s4_accountless", basic_svg("Account-less OTP Access"))
save_svg("s4_priority", basic_svg("Priority Scoring Scale"))
save_svg("s4_registry", basic_svg("Public Registry UI"))

# Slide 5
save_svg("s5_in_scope", basic_svg("In Scope Features"))
save_svg("s5_out_scope", basic_svg("Out of Scope"))
save_svg("s5_future", basic_svg("Future AI Integration"))

# Slide 6
save_svg("s6_meth_1", basic_svg("Phase 1: Analysis & Design"))
save_svg("s6_meth_2", basic_svg("Phase 2: Development"))
save_svg("s6_meth_3", basic_svg("Phase 3: Deployment"))

# Slide 7
save_svg("s7_frontend", basic_svg("Frontend: React + Vite"))
save_svg("s7_backend", basic_svg("Backend: Express + MongoDB"))
save_svg("s7_full_arch", basic_svg("End-to-end Architecture"))

# Slide 8
save_svg("s8_yolo", basic_svg("YOLO Detection Bounding Box"))
save_svg("s8_admin_queue", basic_svg("Admin Review Queue"))
save_svg("s8_confidence", basic_svg("High vs Low Confidence"))

# Slide 9
save_svg("s9_swipe_ui", basic_svg("App UI: Swiping Yes/No"))
save_svg("s9_otp_ui", basic_svg("App UI: OTP Verification"))
save_svg("s9_success_ui", basic_svg("App UI: Tracking ID Success"))

# Slide 10
save_svg("s10_transparent", basic_svg("Transparency Assured"))
save_svg("s10_triage", basic_svg("Automated Triage"))
save_svg("s10_overview", basic_svg("Final System Overview"))

print("SVGs generated successfully.")

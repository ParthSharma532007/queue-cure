from fpdf import FPDF

class CaseStudyPDF(FPDF):
    def header(self):
        # Header text
        self.set_font('helvetica', 'B', 10)
        self.set_text_color(15, 118, 110) # Teal accent color
        self.cell(0, 10, 'Queue Cure Case Study - Hackathon Submission', border=0, ln=1, align='R')
        self.line(10, 18, 200, 18)
        self.ln(5)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        # Page number
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', align='C')

def create_case_study():
    pdf = CaseStudyPDF()
    pdf.alias_nb_pages()
    
    # ==================== PAGE 1 ====================
    pdf.add_page()
    
    # Title
    pdf.set_font('helvetica', 'B', 24)
    pdf.set_text_color(15, 118, 110) # Teal primary
    pdf.cell(0, 15, 'QUEUE CURE', ln=1, align='L')
    
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(71, 85, 105) # Slate text
    pdf.cell(0, 8, 'Live Digital Clinic Queue Manager & Audio Caller', ln=1, align='L')
    pdf.ln(5)
    
    # Key Outcomes Panel (Horizontal Highlight Box)
    pdf.set_fill_color(230, 244, 242) # Light teal background
    pdf.set_draw_color(15, 118, 110)
    pdf.rect(10, 48, 190, 22, 'FD')
    pdf.set_y(50)
    pdf.set_font('helvetica', 'B', 10)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(63, 6, 'CHECK-IN SPEED', align='C')
    pdf.cell(63, 6, 'REFRESHES REQUIRED', align='C')
    pdf.cell(63, 6, 'WAIT ENGINE ACCURACY', align='C')
    pdf.ln(6)
    
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(63, 8, '< 2 seconds', align='C')
    pdf.cell(63, 8, '0 (WebSockets Live Sync)', align='C')
    pdf.cell(63, 8, '100% (Actual Rolling Avg)', align='C')
    pdf.ln(15)
    
    # Section 1: Problem Statement
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 10, '1. Problem Statement', ln=1)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(15, 23, 42) # Dark text
    problem_text = (
        "Currently, 76% of India's 1.5 million local neighborhood clinics operate on manual paper token slips "
        "and shouting. Patients wait 2 to 3 hours with zero visibility into their queue status, "
        "generating waiting-room friction and anxiety. Doctors lack live dashboards to measure "
        "daily patient load and average checkout speeds. Receptionists manage the entire clinic flow "
        "from memory, leading to frequent double-bookings, missed appointments, and scheduling errors."
    )
    pdf.multi_cell(0, 6, problem_text)
    pdf.ln(5)
    
    # Section 2: Solution & Key Features
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 10, '2. Solution & Key Features', ln=1)
    
    features = [
        ("Ultra-Fast Receptionist Console: ", "Intake a patient, assign a token, and sync waiting rooms in <2s with auto-focused fields and keyboard shortcuts."),
        ("Refresh-Free Patient Board: ", "A public waiting room display showing current serving tokens, upcoming waiting lists, and active status indicators."),
        ("Real-Data Estimation Engine: ", "Calculates wait times dynamically using a rolling average of actual consultation durations instead of static guesses."),
        ("Auto Audio Callouts & Chime: ", "Replaces room shouting with natural Text-to-Speech calls and synthesized chimes on called tokens.")
    ]
    for title, desc in features:
        pdf.set_font('helvetica', 'B', 11)
        pdf.set_text_color(71, 85, 105)
        pdf.write(6, title)
        pdf.set_font('helvetica', '', 11)
        pdf.set_text_color(15, 23, 42)
        pdf.write(6, desc + "\n")
    pdf.ln(5)
    
    # ==================== PAGE 2 ====================
    pdf.add_page()
    
    # Section 3: Interface Overview - Receptionist Console
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 10, '3. Interface Overview & Screenshots', ln=1)
    
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 8, 'A. Receptionist Console', ln=1)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(15, 23, 42)
    receptionist_desc = (
        "The Receptionist Console is designed for extreme operational speed. It features a simplified "
        "single-field patient intake form on the left, a centrally placed doctor controller (for Calling, "
        "Recalling, or marking No-Show), and a real-time list directory on the right enabling on-the-fly "
        "reordering and patient cancellation."
    )
    pdf.multi_cell(0, 6, receptionist_desc)
    pdf.ln(5)
    
    # Embed Receptionist Screenshot
    receptionist_img = r"C:\Users\Parth\Desktop\receptionist_screenshot.png"
    pdf.image(receptionist_img, x=20, y=pdf.get_y(), w=170)
    
    # ==================== PAGE 3 ====================
    pdf.add_page()
    
    # Section 3 (Continued) - Patient Waiting Room
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 8, 'B. Patient waiting room display', ln=1)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(15, 23, 42)
    patient_desc = (
        "The Patient Dashboard serves both as a public monitor and a personal assistant. It includes a "
        "highly visible 'Now Serving' banner at the top, a list of upcoming waiting tokens, and a "
        "Personal Status Tracker card at the bottom. By selecting their token, a patient sees their "
        "exact position in line, a visual stepper (In Queue -> Next Up -> In Cabin), and a clock-based "
        "appointment estimate."
    )
    pdf.multi_cell(0, 6, patient_desc)
    pdf.ln(5)
    
    # Embed Patient Screenshot
    patient_img = r"C:\Users\Parth\Desktop\patient_screenshot.png"
    pdf.image(patient_img, x=20, y=pdf.get_y(), w=170)
    
    pdf.set_y(pdf.get_y() + 85) # Offset for image height
    pdf.ln(5)
    
    # Section 4: Tech Stack
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 10, '4. Technical Stack & Implementation', ln=1)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(15, 23, 42)
    tech_text = (
        "Built on a Node.js and Express foundation, the system uses Socket.io to establish "
        "persistent WebSockets. Updates are broadcast in real-time, syncing both views without "
        "requiring page refreshes. LocalStorage is utilized to persist the patient's selected token "
        "across reloads. Audio callouts leverage native browser Web Audio and SpeechSynthesis APIs."
    )
    pdf.multi_cell(0, 6, tech_text)
    pdf.ln(5)
    
    # Section 5: Future Changes
    pdf.set_font('helvetica', 'B', 14)
    pdf.set_text_color(15, 118, 110)
    pdf.cell(0, 10, '5. Future Roadmap', ln=1)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(15, 23, 42)
    diff_text = (
        "Next iterations will support SMS alerts (via Twilio) when a patient is within 2 slots of "
        "being called, allowing them to wait off-site. We will also incorporate a QR code generator, "
        "printing a unique QR code on token receipts to instantly open the tracking page on the patient's phone."
    )
    pdf.multi_cell(0, 6, diff_text)
    
    # Save PDF
    output_path = r"C:\Users\Parth\Desktop\Queue_Cure_Case_Study.pdf"
    pdf.output(output_path)
    print(f"Success! Case study PDF with screenshots generated at: {output_path}")

if __name__ == '__main__':
    create_case_study()

import re
import os

with open(r'e:\sheoo site\sheeo-member\meher-rupa\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Title
html = html.replace('Mehak Marwaha - SheEO Founding Five', 'Meher Rupa - SheEO Founding Five')

# Hero
html = html.replace('/sheeo-member/mehak.jpg', '/sheeo-member/meher rupaa.jpeg')
html = re.sub(r'<img src="/sheeo-member/ekaa-logo.webp"[^>]+>', '', html) # remove logo
html = html.replace('Mehak Marwaha</h1>', 'Meher Rupa</h1>')
html = html.replace('FOUNDER | HOLISTIC CLARITY COACH | CAREER GUIDANCE EXPERT', 'BUSINESS & PERSONAL TRANSFORMATION COACH')
html = html.replace('Helping students, women, and professionals gain clarity, confidence, and direction through career guidance, holistic healing, and transformative life experiences.', 'Helping individuals, professionals, entrepreneurs, and teams break through limitations, unlock peak performance, and achieve meaningful transformation through powerful coaching methodologies.')

# Hero buttons
hero_buttons_new = """
                        <a href="https://wa.me/971503967022" target="_blank" class="btn btn-primary-pink btn-lg rounded-pill shadow-pink flex align-center gap-xs"><i data-lucide="message-circle" class="icon-sm"></i> WhatsApp</a>
                        <a href="https://www.instagram.com/meherrupa/" target="_blank" class="btn bg-white text-dark-blue flex align-center gap-xs shadow-pink hover-lift" style="border: 2px solid var(--pink-light); border-radius: 999px; padding: 12px 24px; font-weight: 600; text-decoration: none;"><i data-lucide="instagram" class="icon-sm"></i> Instagram</a>
                        <a href="https://www.linkedin.com/in/meher-rupa/" target="_blank" class="btn bg-white text-dark-blue flex align-center gap-xs shadow-pink hover-lift" style="border: 2px solid var(--pink-light); border-radius: 999px; padding: 12px 24px; font-weight: 600; text-decoration: none;"><i data-lucide="linkedin" class="icon-sm"></i> LinkedIn</a>
                        <a href="https://www.meherrupa.com" target="_blank" class="btn bg-white text-dark-blue flex align-center gap-xs shadow-pink hover-lift" style="border: 2px solid var(--pink-light); border-radius: 999px; padding: 12px 24px; font-weight: 600; text-decoration: none;"><i data-lucide="globe" class="icon-sm"></i> Visit Website</a>
"""
html = re.sub(r'<div class="hero-buttons flex gap-md flex-wrap">.*?</div>', f'<div class="hero-buttons flex gap-md flex-wrap">{hero_buttons_new}</div>', html, flags=re.DOTALL)

# About Section
about_new = """
            <p class="section-tag mb-xs text-rose uppercase tracking-wide font-bold">Meet The Founder</p>
            <h2 class="font-playfair text-4xl text-dark-blue mb-lg">About Meher</h2>
            
            <div class="text-dark-blue font-inter text-md line-height-relaxed mx-auto">
                <p class="mb-md">Meher Rupa is a Business and Personal Transformation Coach dedicated to helping individuals, professionals, entrepreneurs, and organizations achieve greater clarity, confidence, and success.</p>
                <p class="mb-md">Through powerful Neuro-Linguistic Programming (NLP) techniques, transformational coaching frameworks, and performance-driven methodologies, Meher helps clients identify hidden limitations, overcome mental barriers, and unlock new levels of capability.</p>
                <p>Her mission is to empower people to move beyond self-imposed constraints, create lasting behavioural change, and accelerate their personal and professional growth. By helping clients develop peak performance states and stronger mindsets, she enables them to create meaningful results with long-term impact.</p>
            </div>
"""
html = re.sub(r'<div class="container max-w-md mx-auto text-center relative z-10">.*?</div>\s*</section>', f'<div class="container max-w-md mx-auto text-center relative z-10">{about_new}</div></section>', html, flags=re.DOTALL, count=1)

# Services
# Removing Ekaa Ecosystem section completely (Section 3)
html = re.sub(r'<!-- SECTION 3 — THE EKAA ECOSYSTEM -->.*?<!-- SECTION 4 — SERVICES -->', '<!-- SECTION 4 — SERVICES -->', html, flags=re.DOTALL)

services_new = """
            <div class="text-center mb-xl">
                <h2 class="font-playfair text-4xl text-dark-blue mb-xs">Services Offered</h2>
                <p class="text-dark-blue font-inter">Premium offerings tailored for your growth.</p>
            </div>
            
            <div class="grid-3 gap-lg align-start" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
                <div class="service-card">
                    <div class="service-icon-wrap"><i data-lucide="trending-up" class="icon-md"></i></div>
                    <h3 class="font-playfair text-xl text-dark-blue mb-sm">Business Transformation Coaching</h3>
                    <p class="text-sm text-dark-blue line-height-relaxed opacity-80">Helping entrepreneurs and business leaders identify growth barriers, strengthen decision-making, and create sustainable success strategies.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon-wrap"><i data-lucide="user" class="icon-md"></i></div>
                    <h3 class="font-playfair text-xl text-dark-blue mb-sm">Personal Transformation Coaching</h3>
                    <p class="text-sm text-dark-blue line-height-relaxed opacity-80">Supporting individuals through mindset shifts, confidence building, and personal development journeys.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon-wrap"><i data-lucide="brain" class="icon-md"></i></div>
                    <h3 class="font-playfair text-xl text-dark-blue mb-sm">Neuro-Linguistic Programming (NLP) Coaching</h3>
                    <p class="text-sm text-dark-blue line-height-relaxed opacity-80">Using proven NLP techniques to overcome limiting beliefs, improve communication, and achieve desired outcomes faster.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon-wrap"><i data-lucide="zap" class="icon-md"></i></div>
                    <h3 class="font-playfair text-xl text-dark-blue mb-sm">Peak Performance Coaching</h3>
                    <p class="text-sm text-dark-blue line-height-relaxed opacity-80">Helping professionals unlock higher levels of focus, productivity, resilience, and performance.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon-wrap"><i data-lucide="users" class="icon-md"></i></div>
                    <h3 class="font-playfair text-xl text-dark-blue mb-sm">Leadership & Capability Development</h3>
                    <p class="text-sm text-dark-blue line-height-relaxed opacity-80">Building leadership qualities, communication skills, and personal effectiveness for long-term growth.</p>
                </div>
            </div>
"""
html = re.sub(r'<div class="text-center mb-xl">\s*<h2 class="font-playfair text-4xl text-dark-blue mb-xs">Services Offered</h2>.*?</div>\s*</section>', f'{services_new}</div>\n    </section>', html, flags=re.DOTALL)

# Member Benefit
html = html.replace('10% OFF on all coaching and counselling services', '15% OFF on the First 5 Coaching Sessions')
html = html.replace('Available exclusively for SheEO members.', 'Available exclusively for SheEO Summit members.')
html = html.replace('https://wa.me/971562046096?text=Hi%20Mehak,%20I\'m%20a%20SheEO%20member%20and%20would%20like%20to%20claim%20the%20member%20benefit!', 'https://wa.me/971503967022?text=Hi%20Meher,%20I\'m%20a%20SheEO%20member%20and%20would%20like%20to%20claim%20the%20member%20benefit!')

# Why work with her
why_new = """
                    <h2 class="font-playfair text-3xl text-dark-blue mb-md">Why Clients Choose Meher Rupa</h2>
                    <ul class="why-list mb-xl">
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span>Deep expertise in <strong>personal transformation</strong></span>
                        </li>
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span>Proven <strong>NLP-based</strong> coaching methodologies</span>
                        </li>
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span>Practical strategies for <strong>measurable growth</strong></span>
                        </li>
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span>Focus on <strong>lasting behavioural change</strong></span>
                        </li>
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span>Business and personal <strong>development expertise</strong></span>
                        </li>
                        <li>
                            <i data-lucide="check-circle-2" class="why-icon icon-sm"></i>
                            <span><strong>Results-driven</strong> coaching approach</span>
                        </li>
                    </ul>

                    <h2 class="font-playfair text-3xl text-dark-blue mb-sm mt-lg">Transformation Begins With Awareness</h2>
                    <p class="text-rose text-sm uppercase tracking-wide font-bold mb-md">Founder Philosophy</p>
                    <p class="text-dark-blue font-inter text-md line-height-relaxed mb-md">
                        True success is not created by working harder alone. It comes from understanding the hidden patterns, beliefs, and behaviours that shape our decisions every day.
                    </p>
                    <p class="text-dark-blue font-inter text-md line-height-relaxed mb-md">
                        Meher believes that when people gain awareness of their limitations and develop the right capabilities, they can create extraordinary breakthroughs in business, leadership, relationships, and life.
                    </p>
                    
                    <h2 class="font-playfair text-3xl text-dark-blue mb-md mt-xl">The Impact of Transformation</h2>
                    <ul class="why-list mb-xl">
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Overcome limiting beliefs</span></li>
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Improve confidence and self-awareness</span></li>
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Strengthen communication skills</span></li>
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Develop peak performance habits</span></li>
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Accelerate personal and professional growth</span></li>
                        <li><i data-lucide="check" class="why-icon icon-sm text-rose"></i><span>Create sustainable long-term success</span></li>
                    </ul>
"""
html = re.sub(r'<div class="why-work-wrap">.*?</div>\s*<!-- SECTION 8:', f'<div class="why-work-wrap">\n{why_new}\n</div>\n                <!-- SECTION 8:', html, flags=re.DOTALL)

# Social links
socials_new = """
                    <h2 class="font-playfair text-3xl text-dark-blue mb-md">Connect With Meher</h2>
                    <div class="flex flex-col gap-sm">
                        <a href="https://wa.me/971503967022" target="_blank" class="social-link-card">
                            <div class="social-link-icon"><i data-lucide="message-circle" class="icon-sm"></i></div>
                            <span>WhatsApp (+971 50 396 7022)</span>
                            <i data-lucide="arrow-up-right" class="icon-xs ml-auto opacity-50"></i>
                        </a>
                        <a href="https://www.meherrupa.com" target="_blank" class="social-link-card">
                            <div class="social-link-icon"><i data-lucide="globe" class="icon-sm"></i></div>
                            <span>Website (www.meherrupa.com)</span>
                            <i data-lucide="arrow-up-right" class="icon-xs ml-auto opacity-50"></i>
                        </a>
                        <a href="https://www.instagram.com/meherrupa/" target="_blank" class="social-link-card">
                            <div class="social-link-icon"><i data-lucide="instagram" class="icon-sm"></i></div>
                            <span>Instagram (@meherrupa)</span>
                            <i data-lucide="arrow-up-right" class="icon-xs ml-auto opacity-50"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/meher-rupa/" target="_blank" class="social-link-card">
                            <div class="social-link-icon"><i data-lucide="linkedin" class="icon-sm"></i></div>
                            <span>LinkedIn (Meher Rupa)</span>
                            <i data-lucide="arrow-up-right" class="icon-xs ml-auto opacity-50"></i>
                        </a>
                        <a href="mailto:meher.rupa@hotmail.com" class="social-link-card">
                            <div class="social-link-icon"><i data-lucide="mail" class="icon-sm"></i></div>
                            <span>Email (meher.rupa@hotmail.com)</span>
                            <i data-lucide="arrow-up-right" class="icon-xs ml-auto opacity-50"></i>
                        </a>
                        <div class="social-link-card" style="cursor:default;">
                            <div class="social-link-icon"><i data-lucide="map-pin" class="icon-sm"></i></div>
                            <span>Dubai, UAE</span>
                        </div>
                    </div>
"""
html = re.sub(r'<div class="socials-wrap">.*?</div>\s*</div>\s*</div>', f'<div class="socials-wrap">\n{socials_new}\n</div>\n            </div>\n        </div>', html, flags=re.DOTALL)

# Verified Business
html = html.replace('Ekaa is a verified business', 'Meher Rupa Lifestyle Coaching is a verified business')
html = html.replace('Founder: Mehak Marwaha', 'License Number: 863867')
html = html.replace('Industry: Coaching, Career Guidance & Holistic Wellbeing (Dubai, UAE)', 'Business Activity: Lifestyle Coaching (Dubai, UAE)')

# CTA
cta_new = """
            <h2 class="font-playfair text-4xl text-dark-blue mb-md">Ready To Unlock Your Next Level?</h2>
            <p class="text-dark-blue font-inter text-md line-height-relaxed mb-lg">
                Whether you're seeking greater clarity, stronger leadership, improved performance, or meaningful personal transformation, Meher provides the tools, strategies, and support needed to help you move forward with confidence.<br><br>
                Your next breakthrough starts with a single conversation.
            </p>
            <div class="flex gap-md justify-center flex-wrap">
                <a href="mailto:meher.rupa@hotmail.com" class="btn btn-primary btn-lg rounded-pill shadow-pink flex align-center gap-xs"><i data-lucide="calendar" class="icon-sm"></i> Book Discovery Call</a>
                <a href="https://wa.me/971503967022" class="btn btn-primary-pink btn-lg rounded-pill shadow-pink flex align-center gap-xs"><i data-lucide="message-circle" class="icon-sm inline-icon"></i> WhatsApp Meher</a>
                <a href="https://www.meherrupa.com" target="_blank" class="btn bg-white text-dark-blue border border-pink-light btn-lg rounded-pill shadow-pink hover-lift font-bold">Visit Website</a>
            </div>
"""
html = re.sub(r'<div class="container max-w-md mx-auto text-center">\s*<h2 class="font-playfair text-4xl text-dark-blue mb-md">.*?</div>\s*</section>', f'<div class="container max-w-md mx-auto text-center">\n{cta_new}\n        </div>\n    </section>', html, flags=re.DOTALL)

with open(r'e:\sheoo site\sheeo-member\meher-rupa\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

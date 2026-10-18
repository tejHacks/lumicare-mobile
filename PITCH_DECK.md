# LumiCare Hackathon Pitch Deck

Draft structure — replace bracketed items with team-verified facts. Do not claim clinical accuracy or invent impact metrics.

## 1. Title
**LumiCare**  
Offline-first newborn jaundice screening support and follow-up  
[Team name] · [Hackathon]

## 2. The problem
- Newborn jaundice needs timely attention, but families may have limited access to clear guidance and follow-up.
- Care information, screening notes, and referral details can be fragmented or hard to keep available offline.
- Add one sourced statistic relevant to the target community: [metric + source + year].

## 3. Who we serve
- Primary users: [caregivers / community health workers / clinics — confirm scope].
- Context: limited connectivity, shared care responsibilities, and need for understandable next steps.
- Validate this persona with [interviews, field observations, or partner input].

## 4. Our solution
- Guided eye-photo workflow and clear safety guidance.
- Local screening records, baby profile, reminders, and referral information.
- Educational content and shareable reports designed to work on-device.
- Demo explicitly labeled: the current model is an engineering prototype, not a diagnosis.

## 5. Product walkthrough
1. Set up caregiver and baby details.
2. Review how and when to seek professional care.
3. Capture/select an eye photo and view the clearly labeled result.
4. Save a record, plan follow-up, or export a report.

## 6. How it works
- Mobile app built with Expo / React Native.
- On-device ONNX eye segmentation plus a locally ported classifier for evaluation.
- Encrypted local database; model assets bundled in the native app.
- Show architecture: camera/photo → local model → provisional result → saved record / referral.

## 7. Safety, privacy, and limitations
- The model is not clinically validated; results must not be used to diagnose or rule out jaundice.
- Danger signs or concern require prompt assessment by a qualified health professional.
- Explain consent, image retention/deletion, backup behavior, and encryption accurately before presenting as finalized.
- State that clinical validation and professional review are required before real-world screening use.

## 8. Validation plan and impact
- Next: install and test the Android build on target devices; check camera, offline flow, accessibility, and image handling.
- Compare mobile output with the Python reference on held-out images; measure parity and failure cases.
- Work with clinical reviewers and community partners to define safe evaluation and referral workflows.
- Track pilot measures only after approval: [workflow completion], [referral follow-up], [user comprehension].

## 9. Roadmap / ask
- Near term: stable Android test build, device testing, and usability feedback.
- Next: privacy review, clinical protocol, and supervised validation study.
- Ask: [clinical partner / pilot site / mentors / funding / evaluation dataset].

## 10. Closing
**LumiCare helps families keep guidance and follow-up close at hand.**  
[One concrete ask] · [Contact / QR code]

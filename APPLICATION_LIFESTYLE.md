## 7. The most important correction: LumiCare's PachiPanda category

Buddy, I've checked the actual PachiPanda pitch document you supplied, including your submitted entry. This changes how we should prioritise the features.

Your entry is explicitly titled “LumiCare: AI-Powered Neonatal Jaundice Care Solution” and sits in Climate Smart Cities and Urban Resilience — not general maternal wellness and not the Pollution category.&#x20;

Pasted markdown.md



Your pitch's central argument is that LumiCare can help protect newborns in underserved urban and peri-urban communities when flooding, extreme weather, electricity instability, and disrupted transport make access to conventional healthcare more difficult. It specifically describes on-device screening without requiring internet connectivity.&#x20;

Pasted markdown.md



That means the MamaCare website is a useful source of feature ideas, but we must not simply copy its feature list into LumiCare. Our features must strengthen your actual submission.

## 8. My final five feature recommendations

[Smartphone app successfully detects jaundice in newborn babies – Physics World](https://images.openai.com/static-rsc-4/Rw8CRFtJ3c-Cucum2WXk9Ocn3TLcINwLWLHCj00TwRohasFLAeGm31jf2lDCvMDkUqW_MkZuDvHrSeG_Qe-UtDZvC04IavAK47n0SctIe6DLRTRbEi_v-r92eyBfrcPZS_jMZhhvg4lbk5XtKJnfBpa2aPZQdgWmmb13YJlI6Lg?purpose=inline)

1\. Offline neonatal jaundice screening

Highest priority

This is LumiCare's defining feature. Build the screening workflow around the existing model only if it is ready for integration and has appropriate clinical validation. Run inference locally, save screening history on the phone, and provide clear next-step guidance.

Why it fits: It directly implements the submitted innovation rather than turning LumiCare into a generic baby tracker.

[inHealth Wellbeing App - inHealth Strategies](https://images.openai.com/static-rsc-4/At3uGrMKGJ_-waSSuM1ZEpsF6QoyyP0eXcYvI2qKx7N2N-e8RrhomzwrKyf7fDAk7T2zviBiWcpIRVwuGHufzXdb22FKQdOp2nYFax1LEu3tkQPuOQaTY5-ESyngFtzRK9iX2OIh8O7hHV4z8p-gb6DYhYmK2-xmCCLDZvFAKqA?purpose=inline)

2\. Local screening records and follow-up tracking

Save the screening date, result category, relevant notes, recommended action, and follow-up status. Make previous records accessible offline.

Why it fits: Health workers can maintain continuity of care when connectivity or access to a central facility is disrupted.

[Platforms - App Authoring](https://images.openai.com/static-rsc-4/-L1NRkOQPWerZYI5-oTF9TC-0BgR7LA0BYa8zKzg5zUtSRU1J4ySfEFCNVs-wlw9GCXyfAda6E1ICbkkevP-SXKLL4J3-Yic8IHPblBF-5sCP-Mt63zRKuhqiEXt6q-7AjGUNP1IlZcQOKb4x0lIbgtq1f4hrrfSdn7NDecbcWU?purpose=inline)

3\. Offline newborn health and danger-sign guide

Bundle reviewed information about jaundice, newborn feeding, urgent warning signs, and when to seek professional care.

Why it fits: Families and frontline health workers can access essential information even during network outages. The app must not imply that a reassuring screening result rules out serious illness.

[Reporta Health - Driving quality healthcare with technology](https://images.openai.com/static-rsc-4/odfR1VGHN85TkaUzFpLUM-ni8FOI5_pNR0ukRioUOqsu6n3i9n7F8H3ETYACQoq_4KSNLCL9aUeaIXWWIiFpr2EQG5z0Q7mvdbn8BEOEcS7nQXSoNjFlLQwn_Y_ci4AUR83hgN2Bl8jdMkSM2tMUyxgsRY9jHdFhBf06f9Z53FU?purpose=inline)

4\. Healthcare referral and emergency contacts

Store verified local facility contacts, referral instructions, and family emergency contacts. Allow a health worker to record that a referral was made.

Why it fits: Screening has greater practical value when it connects a potentially at-risk newborn to appropriate care. For offline use, facility details must be preloaded and periodically maintained.

[ParentPA: UK Pregnancy Checklist & NHS Appointment Planner](https://images.openai.com/static-rsc-4/4lJvtT8HHBF3g8yvOg-8wLn8m5EIvxpa9HQX8cHlyh9hyddck8-k3lZIjzhFks0GwiPaEH-IvaICrjOkIx1XbyW9Lr3NM6FNQzl_KNixm2OmVAv3hiJ0lwUHUTbXedSzLqhiyXbe_juyLF_-IgfjehdXmq6S1BbX4eiOK3UhG7w?purpose=inline)

5\. Local follow-up reminders

Schedule on-device reminders for follow-up appointments and clinician-directed reviews. Let users mark visits as completed and retain the history locally.

Why it fits: It supports continuity of care for families who may face transport difficulties or interruptions to health services during extreme weather.

These five features reinforce the pitch's main themes: decentralised healthcare, low-resource operation, resilience during infrastructure disruptions, and early action for newborn health.&#x20;

Pasted markdown.md



## 9. The storage we should build for these features

Because LumiCare is offline-first, I would now adapt the database to the actual pitch rather than build the generic baby-wellness schema.

| SQLite table         | What it stores                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| `babies`             | Baby profile and date of birth                                             |
| `screenings`         | Screening timestamp, result category, model version, and follow-up action  |
| `follow_ups`         | Referral status, due date, and completion status                           |
| `health_facilities`  | Preloaded facility names, locations, phone numbers, and available services |
| `emergency_contacts` | Family and verified emergency contacts                                     |
| `care_tasks`         | Local follow-up and appointment reminders                                  |

The health education library can be bundled as local JSON or TypeScript data. We do not need to create a database table for every static article.

One important medical safeguard: screening results must be presented as screening information, not definitive diagnoses or measured bilirubin concentrations unless the model has been validated for that specific use. Concerning symptoms should prompt urgent professional assessment regardless of the app's result.

## 10. What I would leave out for the PachiPanda pitch

- Expense tracking and grocery lists.
- Baby shopping and lullabies.
- A general-purpose AI parenting chatbot.
- BMI calculators and generic milestone journals.
- A pediatrician finder that depends on live internet access.

These are not inherently bad features. They simply dilute LumiCare's central proposition when our time is limited.

Our pitch story should be simple: a low-resource mobile application that helps make neonatal jaundice screening more accessible and supports follow-up care in Nigerian communities where healthcare access can be disrupted.

Buddy, that is the direction I would commit to. First, get the offline database working; second, integrate the actual jaundice-screening workflow; third, build the records, referral, education, and reminder features around it.
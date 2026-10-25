
import re

from pypdf import PdfReader
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "ok",
        "message": "DocuFlow backend is running"
    })


@api_view(["POST"])
def ask_question(request):
    question = request.data.get("question", "").strip()
    extracted_text = request.data.get("text", "").strip()

    if not question:
        return Response(
            {"error": "Please enter a question."},
            status=400
        )

    if not extracted_text:
        return Response(
            {"error": "Please upload a PDF first."},
            status=400
        )

    # Split the document into sentences.
    sentences = re.split(
        r"(?<=[.!?])\s+|\n+",
        extracted_text
    )

    stop_words = {
        "the", "is", "a", "an", "and", "or", "of", "to",
        "in", "on", "for", "what", "when", "where", "who",
        "how", "why", "does", "do", "did", "was", "were",
        "are", "this", "that", "with", "tell", "me", "about",
        "please", "can", "could", "would", "you", "your",
        "from", "document", "pdf"
    }

    def get_keywords(value):
        words = re.findall(
            r"\b[a-zA-Z0-9]+\b",
            value.lower()
        )
        return {
            word for word in words
            if word not in stop_words and len(word) > 1
        }

    question_words = get_keywords(question)

    # Score sentences based on matching question keywords.
    ranked_sentences = []

    for sentence in sentences:
        sentence = sentence.strip()

        if not sentence:
            continue

        sentence_words = get_keywords(sentence)
        matching_words = question_words.intersection(
            sentence_words
        )

        if matching_words:
            score = len(matching_words) / len(question_words)

            ranked_sentences.append({
                "sentence": sentence,
                "score": score
            })

    ranked_sentences.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    matches = [
        item["sentence"]
        for item in ranked_sentences[:3]
    ]

    # If no keywords match, provide the opening passages
    # for broad questions such as "What is the main topic?"
    if not matches:
        matches = [
            sentence.strip()
            for sentence in sentences
            if sentence.strip()
        ][:3]

    if matches:
        answer = (
            "Relevant passages from your PDF:\n\n"
            + "\n\n".join(matches)
        )
    else:
        answer = (
            "No readable text was found in the document."
        )

    return Response({
        "question": question,
        "answer": answer,
        "matches": matches
    })


@api_view(["POST"])
def upload_document(request):
    uploaded_file = request.FILES.get("file")

    if not uploaded_file:
        return Response(
            {"error": "No file was uploaded."},
            status=400
        )

    if uploaded_file.content_type != "application/pdf":
        return Response(
            {"error": "Only PDF files are allowed."},
            status=400
        )

    try:
        pdf = PdfReader(uploaded_file)

        extracted_text = ""

        for page in pdf.pages:
            page_text = page.extract_text()

            if page_text:
                extracted_text += page_text + "\n"

        # Extract email addresses.
        emails = re.findall(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            extracted_text
        )
        emails = list(dict.fromkeys(emails))

        # Extract Indian mobile numbers.
        phone_numbers = re.findall(
            r"(?:\+?91[\s-]?)?[6-9]\d{9}",
            extracted_text
        )
        phone_numbers = list(dict.fromkeys(phone_numbers))

        # Normalize whitespace for URL and date detection.
        normalized_text = re.sub(
            r"\s+",
            " ",
            extracted_text
        )

        # Extract URLs and common domain names.
        url_pattern = (
            r"(?i)\b(?:https?://|www\.)[^\s<>\"']+"
            r"|\b(?:[a-z0-9-]+\.)+"
            r"(?:com|org|net|edu|gov|in|io|co|uk|dev|app)"
            r"(?:/[^\s<>\"']*)?"
        )

        urls = re.findall(url_pattern, normalized_text)

        urls = [
            url.rstrip(".,;:!?)]}")
            for url in urls
        ]
        urls = list(dict.fromkeys(urls))

        # Extract dates in common formats.
        month = (
            r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|"
            r"Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|"
            r"Aug(?:ust)?|Sep(?:t(?:ember)?)?|"
            r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)"
        )

        date_patterns = [
            # 23/10/2026, 23-10-26, 23.10.2026
            r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b",

            # 2026-10-23
            r"\b\d{4}-\d{1,2}-\d{1,2}\b",

            # 23 October 2026, 23 Oct 2026
            rf"\b\d{{1,2}}\s+{month}(?:,?\s+\d{{2,4}})?\b",

            # October 23, 2026, Oct 23 2026
            rf"\b{month}\s+\d{{1,2}}(?:,?\s+\d{{2,4}})?\b",
        ]

        dates = []

        for pattern in date_patterns:
            dates.extend(
                re.findall(
                    pattern,
                    normalized_text,
                    re.IGNORECASE
                )
            )

        dates = list(dict.fromkeys(dates))

        return Response({
            "message": "PDF processed successfully.",
            "filename": uploaded_file.name,
            "pages": len(pdf.pages),
            "emails": emails,
            "phone_numbers": phone_numbers,
            "urls": urls,
            "dates": dates,
            "text": extracted_text,
        })

    except Exception as error:
        return Response(
            {"error": f"Could not process PDF: {str(error)}"},
            status=500
        )

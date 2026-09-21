# Kommerce Context

This context defines the language for customer accounts and product feedback in Kommerce.

## Product Catalog

**Product Image**:
An optional public visual asset attached to one Product. A Product has at most one Product Image, which may be an uploaded file or an external image URL.
_Avoid_: Gallery, product media

## People

**Customer**:
A person with a Kommerce account who can submit one stored Product Review per product and edit it in place.
_Avoid_: Buyer, user, account

**Admin**:
An authenticated store operator who manages products and reviews and may author reviews. Admin-authored Product Reviews start as Visible Reviews.
_Avoid_: Moderator, staff user

## Product Feedback

**Product Review**:
A customer's or admin's product feedback entry with a required 1-to-5 Rating and optional text. A Product Review remains stored when its visibility changes.
_Avoid_: Comment, testimonial

**Rating**:
The required integer score from 1 to 5 attached to a product review.
_Avoid_: Score, grade

**Visible Review**:
A review available on the public product page and included in public Rating aggregates.
_Avoid_: Approved review, published review

**Hidden Review**:
A stored review excluded from public pages and aggregates, available to Admins for moderation. Customer edits do not make it visible.
_Avoid_: Unpublished review, deleted review

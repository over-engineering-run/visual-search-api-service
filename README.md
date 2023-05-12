# Visual Search API Service

## Endpoints

```http
GET /search/google-lens?url=<url-str>
{
    "visual_matches": [
        {
            "position": "Integer - Position of the image",
            "title": "String - Title of the image",
            "link": "String - Source URL of the website containing the image",
            "source": "String - Displayed name of the website containing the image",
            "thumbnail": "String - URL to the image thumbnail"
        }
    ]
}
```

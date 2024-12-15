from django.urls import path
from .views import example_api, get_google_data, login_view, upload_pdf, fetch_city_state_pincode,extraction_from_pdf, save_comment

urlpatterns = [
    path('example/', example_api, name='example_api'),
    path('get_google_data/', get_google_data, name='get_google_data'),
    path('login/', login_view, name='login'),
    path('upload/', upload_pdf, name='upload_pdf'),
    path('fetch_city_state_pincode/',fetch_city_state_pincode, name='fetch_city_state_pincode'),
    path('extraction_from_pdf/',extraction_from_pdf, name='extraction_from_pdf'),
     path('save-comment/',save_comment, name='save-comment')

    
]
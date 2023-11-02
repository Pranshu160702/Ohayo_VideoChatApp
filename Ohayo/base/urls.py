from django.urls import path
from base import views

urlpatterns = [
    path('', views.indexView),
    path('room/', views.roomView),
    path('get_token/', views.getToken),
    path('create_member/', views.createMember),
    path('get_member/', views.getMember),
    path('delete_member/', views.deleteMember)
]
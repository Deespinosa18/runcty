from rest_framework.pagination import PageNumberPagination


class Paginacion(PageNumberPagination):
    """20 por página; la app puede pedir más con ?page_size=200 (para los selectores)."""

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200

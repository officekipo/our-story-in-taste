export async function searchKakaoPlaces(keyword: string) {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&category_group_code=FD6,CE7`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_KEY}`,
      },
    },
  );
  const data = await res.json();
  return data.documents as {
    place_name: string;
    address_name: string;
    x: string;
    y: string;
    category_name: string;
  }[];
}

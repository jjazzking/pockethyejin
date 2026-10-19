-- 장소마다 추억 사진 여러 장. 해금된 장소의 지도 카드에서 넘겨 본다.
-- image는 대표 사진(맨 앞)으로 그대로 쓰고, 나머지를 photos에 넣는다.
-- 예: {"seongsu-2.jpg", "seongsu-3.jpg"}  (places 버킷 안의 경로)

alter table public.places add column photos text[] not null default '{}';

comment on column public.places.photos is '추가 추억 사진 경로들 (places 버킷). 대표 사진은 image';

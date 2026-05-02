package com.hackathon.resourceallocation.repository;

import com.hackathon.resourceallocation.model.NeedImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NeedImageRepository extends JpaRepository<NeedImage, Long> {

    List<NeedImage> findByNeedId(Long needId);

    List<NeedImage> findByAiProcessedFalse();

    long countByNeedId(Long needId);


}